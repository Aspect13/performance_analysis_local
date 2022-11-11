import json
from pylon.core.tools import web, log

from tools import MinioClient, session_project


class Slot:
    @web.slot('performance_analysis_compare_content')
    def content(self, context, slot, payload):
        project = context.rpc_manager.call.project_get_or_404(project_id=session_project.get())
        file_hash = payload.request.args.get('source')
        log.info('GET qwerty %s', payload.request.args.get('source'))
        log.info('GET qwerty project %s %s', session_project.get(), project)
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
        with context.app.app_context():
            return self.descriptor.render_template(
                'compare/content.html',
                comparison_data=comparison_data
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
