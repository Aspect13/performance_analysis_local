from flask_restful import Resource
from flask import request, jsonify


class API(Resource):
    url_params = [
        '<int:project_id>',
    ]

    def __init__(self, module):
        self.module = module

    def get(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)
        start_time = request.args.get('start_time')
        end_time = request.args.get('end_time')
        aggregation = request.args.get('aggregation')
        test_type = request.args.get('test_type', 'all')
        test_env = request.args.get('test_env', 'all')
        result = []
        for plugin in self.module.active_plugins:
            rpc_result = self.module.context.rpc_manager.call_function_with_timeout(
                func=f'performance_analysis_test_runs_{plugin}',
                timeout=5,
                project_id=project.id,
                start_time=start_time,
                end_time=end_time,
                test_type=test_type,
                test_env=test_env,
                aggregation=aggregation,
            )
            result.extend(rpc_result)

        return jsonify(result)
