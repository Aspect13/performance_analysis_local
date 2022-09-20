from flask_restful import Resource
from flask import request


class API(Resource):
    url_params = [
        '<int:project_id>/<string:group>',
    ]

    def __init__(self, module):
        self.module = module

    def get(self, project_id: int, group: str):
        project = self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)
        result = []
        groups_to_poll = [group] if group != 'all' else self.module.group_mapping_reversed.keys()
        # get tests for each group
        for g in groups_to_poll:
            for i in self.module.group_mapping_reversed.get(g, []):
                rpc_result = self.module.context.rpc_manager.call_function_with_timeout(
                    func=f'performance_analysis_tests_{i.lower()}',
                    timeout=5,
                    project_id=project.id,
                    **request.args
                )
                result.extend(rpc_result)

        return result, 200
