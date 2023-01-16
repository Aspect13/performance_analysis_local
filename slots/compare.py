import json
from collections import defaultdict
from queue import Empty

from pylon.core.tools import web, log

from tools import MinioClient, session_project

from ..utils import process_query_result


class Slot:
    @web.slot('performance_analysis_compare_content')
    def content(self, context, slot, payload):
        project = context.rpc_manager.call.project_get_or_404(project_id=session_project.get())
        file_hash = payload.request.args.get('source')
        # log.info('GET qwerty %s', payload.request.args.get('source'))
        if not file_hash:
            return self.descriptor.render_template(
                'compare/empty.html',
                file_hash=file_hash
            )
        try:
            comparison_data = MinioClient(project).download_file(
                self.descriptor.config.get('bucket_name', 'comparison'),
                f'{file_hash}.json'
            )
        except:
            return self.descriptor.render_template(
                'compare/empty.html',
                file_name=file_hash
            )
        if not comparison_data:
            return self.descriptor.render_template(
                'compare/empty.html',
                file_name=file_hash
            )
        comparison_data = comparison_data.decode('utf-8')
        comparison_data = json.loads(comparison_data)
        baselines = defaultdict(dict)

        def search_json_for_baselines(rep_id: int):
            for test in tuple(comparison_data['tests']):
                if test['id'] == rep_id:
                    return test

        ids_to_query = defaultdict(set)
        rpc_suffix = '_get_baseline_report_id'
        for group, values in comparison_data.get('unique_groups', {}).items():
            for name, env in values:
                try:
                    report_id = context.rpc_manager.call_function_with_timeout(
                        func=f'{group}{rpc_suffix}',
                        timeout=3,
                        project_id=project.id,
                        test_name=name,
                        test_env=env
                    )
                    if report_id:
                        baseline_test = search_json_for_baselines(report_id)
                        if not baseline_test:
                            log.info('Baseline test [%s] is not in selection. Need to query from db.', report_id)
                            ids_to_query[group].add(report_id)
                        else:
                            baselines[group][name] = {
                                env: baseline_test
                            }
                except Empty:
                    ...
        results_rpc_suffix = '_get_results_by_ids'
        for group, ids in ids_to_query.items():
            log.info('querying results for %s ids [%s]', group, ids)
            reports_data = context.rpc_manager.call_function_with_timeout(
                func=f'{group}{results_rpc_suffix}',
                timeout=3,
                project_id=project.id,
                report_ids=ids,
            )
            for report in process_query_result(group, reports_data):
                baselines[group][report.name] = {
                    report.test_env: report.dict(exclude={'total', 'failures'})
                }

        with context.app.app_context():
            return self.descriptor.render_template(
                'compare/content.html',
                comparison_data=comparison_data,
                file_hash=file_hash,
                baselines=baselines
            )

    @web.slot('performance_analysis_compare_scripts')
    def scripts(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'compare/scripts.html',
            )

    @web.slot('performance_analysis_compare_styles')
    def styles(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'compare/styles.html',
            )
