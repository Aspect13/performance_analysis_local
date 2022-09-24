from pylon.core.tools import web, log
from tools import rpc_tools

from ...backend_performance.models.api_tests import PerformanceApiTest
from ...backend_performance.models.api_reports import APIReport
from ...ui_performance.models.ui_report import UIReport
from ...ui_performance.models.ui_tests import UIPerformanceTest



from pydantic import BaseModel, validator, parse_obj_as
from datetime import datetime
from typing import Optional, List
from sqlalchemy import JSON, cast, Integer, String, literal_column

class UIAnalysisModel(BaseModel):
    group: str
    name: str
    start_time: datetime
    test_type: str
    test_env: str
    aggregation: str
    status: str
    duration: int
    thresholds_total: int
    thresholds_failed: int
    tags: Optional[List[str]]
    error_rate: Optional[float]

    @validator('error_rate', always=True)
    def compute_error_rate(cls, value: float, values: dict) -> float:
        if value:
            return value
        try:
            return round((values['thresholds_failed'] / values['thresholds_total']) * 100, 2)
        except ZeroDivisionError:
            return 0

class BackendAnalysisModel(BaseModel):
    group: str
    name: str
    start_time: datetime
    test_type: str
    test_env: str
    aggregation: str
    status: str
    duration: int
    total: int
    failures: int
    tags: Optional[List[str]]
    error_rate: Optional[float]

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
                          start_time,
                          end_time = None,
                          test_type: str = 'all',
                          test_env: str = 'all',
                          aggregation: str = 'all') -> list:
        log.info('ui_performance rpc | %s | %s', project_id, [start_time, end_time, test_type, test_env, aggregation])
        aggregation_mapping = {
            'min': APIReport._min,
            'max': APIReport._max,
            'mean': APIReport.mean,
            'pct95': APIReport.pct95,
            'pct99': APIReport.pct99,
        }
        queried_aggregation = aggregation_mapping.get(aggregation)
        if not queried_aggregation:
            return []
        # result = Recipe.query.filter(
        #     cast(Recipe.recipe['tags'], JSONB).contains(["Thai"])
        # ).all()
        # round((each_json["failures"] / each_json["total"]) * 100, 2)
        columns = ('group', 'name', 'start_time', 'test_type', 'test_env', 'aggregation',
                   'status', 'duration', 'total', 'failures', 'tags')
        query = APIReport.query.with_entities(
            literal_column("'backend_performance'").label('group'),
            APIReport.name,
            APIReport.start_time,
            APIReport.type,
            APIReport.environment,
            queried_aggregation,
            APIReport.test_status['status'],
            APIReport.duration,
            APIReport.total,
            APIReport.failures,
            APIReport.tags
        ).filter(
            APIReport.project_id == project_id,
            APIReport.start_time >= start_time,
            # cast(APIReport.test_status, JSON)['percentage'] == 100
            APIReport.test_status['percentage'].cast(String).cast(Integer) == 100
        )

        if end_time:
            query.filter(APIReport.end_time <= end_time)
        if test_type != 'all':
            query.filter(APIReport.type == test_type)
        if test_env != 'all':
            query.filter(APIReport.environment == test_env)

        result = (
            BackendAnalysisModel(**dict(zip(columns, i)))
            for i in query.all()
        )
        return list(map(lambda i: i.dict(exclude={'total', 'failures'}), result))


    @web.rpc('performance_analysis_test_runs_ui_performance')
    @rpc_tools.wrap_exceptions(RuntimeError)
    def ui_performance_tr(self, project_id: int,
                          start_time,
                          end_time = None,
                          test_type: str = 'all',
                          test_env: str = 'all',
                          aggregation: str = 'all') -> list:
        log.info('backend_performance rpc | %s | %s', project_id, [start_time, end_time, test_type, test_env, aggregation])
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
            UIReport.thresholds_total,
            UIReport.thresholds_failed,
            # UIReport.tag
        ).filter(
            UIReport.project_id == project_id,
            UIReport.start_time >= start_time,
            UIReport.is_active == False,
            UIReport.aggregation == aggregation,
        )
        if end_time:
            query.filter(UIReport.end_time <= end_time)
        if test_type != 'all':
            query.filter(UIReport.test_type == test_type)
        if test_env != 'all':
            query.filter(UIReport.environment == test_env)

        result = (
            UIAnalysisModel(**dict(zip(columns, i)))
            for i in query.all()
        )
        return list(map(lambda i: i.dict(exclude={'thresholds_total', 'thresholds_failed'}), result))
