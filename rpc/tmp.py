from pylon.core.tools import web, log
from tools import rpc_tools

from ...ui_performance.models.ui_report import UIReport
from ...ui_performance.models.ui_tests import UIPerformanceTest

from sqlalchemy import JSON, cast, Integer, String, literal_column, desc, asc, func


class RPC:
    # @web.rpc('performance_analysis_test_runs_ui_performance')
    # @rpc_tools.wrap_exceptions(RuntimeError)
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
