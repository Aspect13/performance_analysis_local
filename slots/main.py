from pylon.core.tools import web, log


class Slot:
    @web.slot('performance_analysis_content')
    def content(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'main/content.html',
            )

    @web.slot('performance_analysis_scripts')
    def scripts(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'main/scripts.html',
            )

    @web.slot('performance_analysis_styles')
    def styles(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template(
                'main/styles.html',
            )
