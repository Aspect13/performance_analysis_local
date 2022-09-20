from flask_restful import Resource


class API(Resource):
    url_params = [
        '<int:project_id>',
    ]

    def __init__(self, module):
        self.module = module

    def get(self, project_id: int):
        self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)

        return list(self.module.groups), 200  # todo: get active plugins and return mapping
