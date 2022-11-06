from pylon.core.tools import web, log


class Slot:
    @web.slot('performance_analysis_compare_content')
    def content(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'compare/content.html',
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
