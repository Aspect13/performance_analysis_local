from pylon.core.tools import web, log
from tools import rpc_tools

from ...backend_performance.models.api_tests import PerformanceApiTest
from ...backend_performance.models.api_reports import APIReport
from ...ui_performance.models.ui_report import UIReport
from ...ui_performance.models.ui_tests import UIPerformanceTest

from pydantic import BaseModel, validator, parse_obj_as
from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy import JSON, cast, Integer, String, literal_column, desc, func
from collections import OrderedDict

class UIAnalysisModel(BaseModel):
    group: str
    name: str
    start_time: datetime
    test_type: str
    test_env: str
    aggregation: str
    status: str
    duration: int
    tags: Optional[List[str]] = []



class BackendAnalysisModel(BaseModel):
    group: str
    name: str
    start_time: datetime
    test_type: str
    test_env: str
    status: str
    duration: int
    total: int
    failures: int
    aggregation_min: float
    aggregation_max: float
    aggregation_mean: float
    aggregation_pct50: float
    aggregation_pct75: float
    aggregation_pct90: float
    aggregation_pct95: float
    aggregation_pct99: float
    throughput: float
    aggregations: Optional[Dict] = {}
    tags: Optional[List[str]] = []
    error_rate: Optional[float]

    @validator('aggregations', always=True)
    def set_aggregations(cls, value: dict, values: dict):
        if value:
            return value
        for k, v in values.items():
            if k.startswith('aggregation_'):
                value[k.split('_')[1]] = v
        return value


    # def dict(self, *args, **kwargs):
    #     log.info('dict %s | %s', args, kwargs)
    #     result = super().dict(*args, **kwargs)
    #     aggregations = dict()
    #     for k in list(result.keys()):
    #         if 'aggregation' in k:
    #             v = result.pop(k)
    #             try:
    #                 aggregations[k.split('_')[1]] = float(v)
    #             except TypeError:
    #                 aggregations[k.split('_')[1]] = v
    #
    #     result['aggregations'].update(aggregations)
    #     return result

    @validator('error_rate', always=True)
    def compute_error_rate(cls, value: float, values: dict) -> float:
        if value:
            return value
        try:
            return round((values['failures'] / values['total']) * 100, 2)
        except ZeroDivisionError:
            return 0


class RPC:
    @web.rpc('performance_analysis_tests_ui_performance')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def ui_performance(self, project_id: int, **kwargs) -> list:
        log.info('ui_performance rpc | %s | %s', project_id, kwargs)
        query_result = UIPerformanceTest.query.with_entities(
            UIPerformanceTest.name,
        ).filter(
            UIPerformanceTest.project_id == project_id
        ).distinct(
            UIPerformanceTest.name
        ).all()
        result = []
        for i in query_result:
            result.extend(i)
        return result

    @web.rpc('performance_analysis_tests_backend_performance')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def backend_performance(self, project_id: int, **kwargs) -> list:
        log.info('backend_performance rpc | %s | %s', project_id, kwargs)
        query_result = PerformanceApiTest.query.with_entities(
            PerformanceApiTest.name,
        ).filter(
            PerformanceApiTest.project_id == project_id
        ).distinct(
            PerformanceApiTest.name
        ).all()
        result = []
        for i in query_result:
            result.extend(i)
        return result

    @web.rpc('performance_analysis_test_runs_backend_performance')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def backend_performance_tr(self, project_id: int,
                               start_time, end_time=None) -> list:
        log.info('ui_performance rpc | %s | %s', project_id, [start_time, end_time, ])
        columns = OrderedDict((
            ('group', literal_column("'backend_performance'").label('group')),
            ('name', APIReport.name),
            ('start_time', APIReport.start_time),
            ('test_type', APIReport.type),
            ('test_env', APIReport.environment),
            ('aggregation_min', APIReport._min),
            ('aggregation_max', APIReport._max),
            ('aggregation_mean', APIReport.mean),
            ('aggregation_pct50', APIReport.pct50),
            ('aggregation_pct75', APIReport.pct75),
            ('aggregation_pct90', APIReport.pct90),
            ('aggregation_pct95', APIReport.pct95),
            ('aggregation_pct99', APIReport.pct99),
            ('throughput', APIReport.throughput),
            ('status', APIReport.test_status['status']),
            ('duration', APIReport.duration),
            ('total', APIReport.total),
            ('failures', APIReport.failures),
            ('tags', APIReport.tags)
        ))
        query = APIReport.query.with_entities(
            *columns.values()
        ).filter(
            APIReport.project_id == project_id,
            APIReport.start_time >= start_time,
            # cast(APIReport.test_status, JSON)['percentage'] == 100

            func.lower(APIReport.test_status['status'].cast(String)).in_(('"finished"', '"failed"', '"success"'))
            # APIReport.test_status['status'].in_(('Finished', 'Failed', 'Success'))
        ).order_by(
            desc(APIReport.start_time)
        )  # todo: sort by time asc

        if end_time:
            query.filter(APIReport.end_time <= end_time)

        result = (
            BackendAnalysisModel.parse_obj(dict(zip(columns.keys(), i)))
            for i in query.all()
        )
        return list(map(lambda i: i.dict(exclude={
            'total', 'failures', *(i for i in columns.keys() if i.startswith('aggregation_'))
        }), result))

    @web.rpc('performance_analysis_test_runs_ui_performance')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def ui_performance_tr(self, project_id: int,
                          start_time,
                          end_time=None) -> list:
        log.info('ui_performance rpc | %s | %s', project_id, [start_time, end_time])

        return []




        columns = ('group', 'name', 'start_time', 'test_type', 'test_env', 'aggregation',
                   'status', 'duration', 'thresholds_total', 'thresholds_failed')
        query = UIReport.query.with_entities(
            literal_column("'ui_performance'").label('group'),
            UIReport.name,
            UIReport.start_time,
            UIReport.test_type,
            UIReport.environment,
            UIReport.aggregation,
            UIReport.test_status['status'],
            UIReport.duration,
            # UIReport.tag
        ).filter(
            UIReport.project_id == project_id,
            UIReport.start_time >= start_time,
            # UIReport.is_active == False,
            # UIReport.aggregation == aggregation,
        )
        if end_time:
            query.filter(UIReport.end_time <= end_time)
        # if test_type != 'all':
        #     query.filter(UIReport.test_type == test_type)
        # if test_env != 'all':
        #     query.filter(UIReport.environment == test_env)

        result = (
            UIAnalysisModel(**dict(zip(columns, i)))
            for i in query.all()
        )
        return list(map(lambda i: i.dict(exclude={'thresholds_total', 'thresholds_failed'}), result))
