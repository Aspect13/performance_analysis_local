import json
from hashlib import md5
from queue import Empty

from flask_restful import Resource
from flask import request, jsonify, send_file, redirect, url_for
from io import BytesIO, StringIO
from collections import defaultdict

from pylon.core.tools import log

from tools import MinioClient, api_tools

from ...utils import process_query_result


class API(Resource):
    url_params = [
        '<int:project_id>',
    ]

    def __init__(self, module):
        self.module = module

    def __upload_to_json(self, project, data: dict) -> str:
        bucket_name = self.module.descriptor.config.get('bucket_name', 'comparison')
        file = BytesIO()
        file.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
        file.seek(0)
        log.debug('File created')
        client = MinioClient(project=project)
        if bucket_name not in client.list_bucket():
            client.create_bucket(bucket_name)
        log.debug('Bucket created [%s]', bucket_name)
        hash_name = md5(file.getbuffer()).hexdigest()
        client.upload_file(bucket_name, file, f'{hash_name}.json')
        log.debug('File uploaded [%s.json]', hash_name)

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
        return hash_name

    def get(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)
        start_time = request.args.get('start_time')
        end_time = request.args.get('end_time')
        tests = []
        for plugin in ('backend_performance', 'ui_performance'):
            try:
                q_data = self.module.context.rpc_manager.call_function_with_timeout(
                    func=f'performance_analysis_test_runs_{plugin}',
                    timeout=3,
                    project_id=project.id,
                    start_time=start_time,
                    end_time=end_time,
                )
                result = process_query_result(plugin, q_data)
                tests.extend(list(map(lambda i: i.dict(exclude={'total', 'failures'}), result)))
            except Empty:
                ...

        return jsonify(tests)

    def post(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)
        data = dict(request.json)
        u = defaultdict(set)
        for t in data['tests']:
            u[t['group']].add((t['name'], t['test_env'],))
        data['unique_groups'] = dict()
        for k, v in u.items():
            data['unique_groups'][k] = list(v)

        if 'ui_performance' in data['unique_groups']:
            ui_only_tests = filter(
                lambda x: x['group'] == 'ui_performance', data['tests']
            )
            ui_performance_builder_data = self.module.context.rpc_manager.timeout(
                3
            ).ui_performance_compile_builder_data(project.id, list(ui_only_tests))
            # merge dataset data with test data
            all_ui_datasets = ui_performance_builder_data.pop('datasets')
            for i in data['tests']:
                if i['group'] == 'ui_performance':
                    datasets = all_ui_datasets.get(i['id'])
                    if datasets:
                        i['datasets'] = datasets
            data['ui_performance_builder_data'] = ui_performance_builder_data

        if 'backend_performance' in data['unique_groups']:
            backend_only_tests = filter(
                lambda x: x['group'] == 'backend_performance', data['tests']
            )
            try:
                backend_performance_builder_data = self.module.context.rpc_manager.timeout(
                    3
                ).backend_performance_compile_builder_data(project.id, list(backend_only_tests))
                # merge dataset data with test data
                all_backend_datasets = backend_performance_builder_data.pop('datasets')
                for i in data['tests']:
                    if i['group'] == 'backend_performance':
                        datasets = all_backend_datasets.get(i['id'])
                        if datasets:
                            i['datasets'] = datasets
                data['backend_performance_builder_data'] = backend_performance_builder_data
            except Empty:
                ...


        hash_name = self.__upload_to_json(project, data)
        return redirect(f'/-/performance/analysis/compare?source={hash_name}')
