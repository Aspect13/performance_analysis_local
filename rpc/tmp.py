from pylon.core.tools import web, log
from tools import rpc_tools

from ...backend_performance.models.api_tests import PerformanceApiTest
from ...ui_performance.models.ui_tests import UIPerformanceTest


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

