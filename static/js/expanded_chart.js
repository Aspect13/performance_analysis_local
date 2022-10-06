const ExpandedChart = {
    props: ['modal_id', 'chart_data'],
    mounted() {
        const chart_options = get_common_chart_options()
        window.charts.expanded_chart = new Chart('expanded_chart', chart_options)
        $(this.$el).on('hide.bs.modal', () => window.charts.expanded_chart.clear())
    },
    template: `
<div :id="modal_id" class="modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered"
        style="min-width: 1200px;"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Modal title</h3>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p>Modal body text goes here.</p>
                <canvas id="expanded_chart"></canvas>
            </div>
<!--            <div class="modal-footer">-->
<!--                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>-->
<!--                <button type="button" class="btn btn-primary">Save changes</button>-->
<!--            </div>-->
        </div>
    </div>
</div>
    `
}

register_component('ExpandedChart', ExpandedChart)