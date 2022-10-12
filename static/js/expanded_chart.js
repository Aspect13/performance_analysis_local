const ExpandedChart = {
    delimiters: ['[[', ']]'],
    props: ['modal_id', 'filtered_tests', 'show', 'initial_max_test_on_chart', 'initial_chart_aggregation', 'data_node'],
    emits: ['update:show'],
    data() {
        return {
            chart_aggregation: 'mean',
            split_by_test: false,
            max_test_on_chart: 6,
        }

    },
    mounted() {
        const chart_options = get_common_chart_options()
        window.charts.expanded_chart = new Chart('expanded_chart', chart_options)
        $(this.$el).on('hide.bs.modal', () => {
            this.$emit('update:show', false)
            window.charts.expanded_chart.clear()
        })
        $(this.$el).on('show.bs.modal', () => {
            this.max_test_on_chart = this.initial_max_test_on_chart
            this.chart_aggregation = this.initial_chart_aggregation
            this.$emit('update:show', true)
            this.$nextTick(this.refresh_pickers)
            this.update_chart()
        })
    },
    watch: {
        show(newValue) {
            $(this.$el).modal(newValue ? 'show' : 'hide')
        },
        chart_aggregation(newValue) {
            this.$nextTick(this.update_chart)
        },
        max_test_on_chart(newValue) {
            // const data = prepare_datasets(
            //     window.charts.expanded_chart,
            //     this.aggregated_data.data,
            //     newValue < this.filtered_tests.length,
            //     `metric[${this.data_node}]`
            // )
            // update_chart(window.charts.expanded_chart, {
            //     datasets: data,
            //     labels: this.aggregated_data.labels
            // }, {
            //     tooltip: get_tooltip_options(
            //         this.aggregated_data.aggregated_tests,
            //         this.aggregated_data.names
            //     ),
            // })
            this.$nextTick(this.update_chart)
        },
        split_by_test(newValue) {

        }
    },
    methods: {
        refresh_pickers() {
            $(this.$el).find('.selectpicker').selectpicker('redner').selectpicker('refresh')
        },
        update_chart() {
            const data = prepare_datasets(
                window.charts.expanded_chart,
                this.aggregated_data.data,
                this.tests_need_grouping,
                `metric[${this.data_node}]`
            )
            update_chart(window.charts.expanded_chart, {
                datasets: data,
                labels: this.aggregated_data.labels
            }, {
                tooltip: get_tooltip_options(
                    this.aggregated_data.aggregated_tests,
                    this.aggregated_data.names
                ),
            })
        },
        need_grouping(tests) {
            return tests.length > this.max_test_on_chart
        }
    },
    computed: {
        grouped_data() {
            return group_data(this.filtered_tests, this.max_test_on_chart)
        },
        aggregation_callback() {
            return aggregation_callback_map[this.chart_aggregation] || aggregation_callback_map.mean
        },
        aggregated_data() {
            const struct = {
                labels: [],
                aggregated_tests: [],
                names: [],
                data: {
                    min: [],
                    max: [],
                    main: []
                },
            }
            this.grouped_data.forEach(group => {
                let dataset
                if (group.hasOwnProperty(this.data_node)) {
                    dataset = group[this.data_node]
                } else if (group.aggregations.hasOwnProperty(this.data_node)) {
                    dataset = group.aggregations[this.data_node]
                } else {
                    console.warn(
                        'No data "', this.data_node, '" in ', group
                    )
                    return
                }
                struct.labels.push(group.start_time)
                struct.aggregated_tests.push(group.aggregated_tests)
                struct.names.push(group.name)
                struct.data.min.push(aggregation_callback_map.min(dataset))
                struct.data.max.push(aggregation_callback_map.max(dataset))
                struct.data.main.push(this.aggregation_callback(dataset))
            })
            console.log('aggregated', struct)
            return struct
        },
        tests_need_grouping() {
            return this.need_grouping(this.filtered_tests)
        }
    },
    template: `
<div :id="modal_id" class="modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered"
        style="min-width: 1200px;"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Chart details</h3>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
<!--                <p>Modal body text goes here.</p>-->
<!--filtered_tests: [[ filtered_tests ]]-->
<div class="d-flex align-items-center">
<div><h5>Toolbar</h5></div>
<div class="d-flex flex-grow-1 justify-content-end align-items-center filter-container">

<div class="custom-input custom-input__sm">
<label class="d-flex align-items-center filter-container">
    <span>Max tests on chart</span>
    <input type="number" class="form-control my-0" 
        style="max-width: 60px;"
        v-model="max_test_on_chart"
    >
</label>
</div>

<div class="d-inline-flex filter-container align-items-center">
<span>Aggregated data</span>
<label class="custom-toggle mt-0">
<input type="checkbox" v-model="split_by_test">
<span class="custom-toggle_slider round"></span>
</label>
<span>Test split data</span>
</div>

<div class="selectpicker-titled d-inline-flex">
    <span class="font-h6 font-semibold px-3 item__left text-uppercase">chart aggregation</span>
    <select class="selectpicker flex-grow-1" data-style="item__right"
        v-model="chart_aggregation"
    >
        <option value="min">min</option>
        <option value="max">max</option>
        <option value="mean">mean</option>
        <option value="pct50">50 pct</option>
        <option value="pct75">75 pct</option>
        <option value="pct90">90 pct</option>
        <option value="pct95">95 pct</option>
        <option value="pct99">99 pct</option>
    </select>
</div>

<button class="btn btn-secondary">Some action</button>
</div>
</div>
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