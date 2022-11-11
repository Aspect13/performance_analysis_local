import json
from hashlib import md5

from flask_restful import Resource
from flask import request, jsonify, send_file, redirect, url_for
from io import BytesIO, StringIO

from pylon.core.tools import log

from tools import MinioClient, api_tools


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
        result = []
        for plugin in ['backend_performance', 'ui_performance']:
            rpc_result = self.module.context.rpc_manager.call_function_with_timeout(
                func=f'performance_analysis_test_runs_{plugin}',
                timeout=5,
                project_id=project.id,
                start_time=start_time,
                end_time=end_time,
            )
            result.extend(rpc_result)

        return jsonify(result)

    def post(self, project_id: int):
        bucket_name = self.module.descriptor.config.get('bucket_name', 'comparison')
        project = self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)
        json_data = json.dumps(request.json, ensure_ascii=False).encode('utf-8')
        file = BytesIO()
        file.write(json_data)
        file.seek(0)
        # file = BytesIO()
        # file.write(request.json['tests'])
        # file.seek(0)
        # file.close()

        log.info('File created')
        # api_tools.upload_file(bucket=bucket_name, f=file, project=project)
        client = MinioClient(project=project)
        if bucket_name not in client.list_bucket():
            client.create_bucket(bucket_name)
        log.info('Bucket created')
        hash_name = md5(file.getbuffer()).hexdigest()
        client.upload_file(bucket_name, file, f'{hash_name}.json')
        log.info('File uploaded')

        # todo: retention
        # from datetime import datetime, timedelta
        # date = datetime.utcnow().replace(
        #     hour=0, minute=0, second=0, microsecond=0,
        # ) + timedelta(minutes=2)
        # from minio.commonconfig import GOVERNANCE
        # from minio.retention import Retention
        # result = client.put_object(
        #     bucket_name=bucket_name,
        #     object_name="my-object",
        #     data=file,
        #     retention=Retention(GOVERNANCE, date),
        # )
        return redirect(url_for('.compare', source=hash_name))
        return redirect(f'/-/performance/analysis/compare?source={hash_name}')
