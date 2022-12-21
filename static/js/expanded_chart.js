const ExpandedChart = {
    delimiters: ['[[', ']]'],
    props: [
        'modal_id', 'filtered_tests', 'show',
        'initial_max_test_on_chart', 'initial_chart_aggregation', 'initial_axis_type',
        'data_node', 'title', 'selected_metric_ui'
    ],
    emits: ['update:show'],
    data() {
        return {
            chart_aggregation: 'mean',
            dataset_type: 'aggregated',
            max_test_on_chart: 6,
            axis_type: 'categorical',
            tmp1: {},
            tmp2: {}
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
            this.axis_type = this.initial_axis_type
            this.dataset_type = 'aggregated'
            this.$emit('update:show', true)
            this.$nextTick(this.refresh_pickers)
            this.handle_update_chart()
        })
    },
    watch: {
        show(newValue) {
            $(this.$el).modal(newValue ? 'show' : 'hide')
        },
        title(newValue) {
            window.charts.expanded_chart.config.options.plugins.title.text = newValue
            window.charts.expanded_chart.update()
        },
        chart_aggregation(newValue) {
            this.$nextTick(this.handle_update_chart)
        },
        max_test_on_chart(newValue) {
            this.$nextTick(this.handle_update_chart)
        },
        split_by_test(newValue) {
            window.charts.expanded_chart.options.interaction.mode = newValue ? 'nearest' : 'index'
            this.handle_update_chart()
            // this.$nextTick(this.handle_update_chart)
        },
        time_axis_type(newValue) {
            window.charts.expanded_chart.options.scales.x.type = newValue ? 'time' : 'category'
            // window.charts.expanded_chart.update()
            this.handle_update_chart()
        },
    },
    methods: {
        refresh_pickers() {
            $(this.$el).find('.selectpicker').selectpicker('redner').selectpicker('refresh')
        },
        handle_update_chart() {
            this.split_by_test ? this.update_chart_by_test() : this.update_chart_all()
        },
        update_chart_all() {
            const data = prepare_datasets(
                window.charts.expanded_chart,
                this.aggregated_data.data,
                true,
                // this.force_min_max || this.tests_need_grouping,
                // `metric[${this.data_node}]`
                'metric'
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
        update_chart_by_test() {
            const split_by_name_tests = this.filtered_tests.reduce((accum, item) => {
                const test_node_name = `${item.name}.${item.test_env}`
                if (!accum.hasOwnProperty(test_node_name)) {
                    accum[test_node_name] = []
                }
                accum[test_node_name].push(item)
                return accum
            }, {})

            this.tmp2 = this.time_groups
            const data = Object.entries(split_by_name_tests).reduce((accum, [test_name, test_data]) => {
                let {data, labels} = accum
                let aggregated_data
                if (this.time_axis_type) {
                    // we assume that tests are sorted asc by time
                    aggregated_data = this.get_aggregated_dataset(
                        group_data_by_timeline(test_data, this.time_groups, {ui_metric_key: this.selected_metric_ui})
                    )
                } else {
                    aggregated_data = this.get_aggregated_dataset(
                        group_data(test_data, this.max_test_on_chart, {ui_metric_key: this.selected_metric_ui})
                    )
                }
                labels.push(aggregated_data.labels)
                return {
                    data: [...data, ...prepare_datasets(
                        window.charts.expanded_chart,
                        aggregated_data.data,
                        true,
                        `${test_name}:${this.data_node}`,
                        `${test_name}:min`,
                        `${test_name}:max`,
                    )], labels
                }
            }, {data: [], labels: []})
            this.tmp1 = data.labels
            update_chart(window.charts.expanded_chart, {
                datasets: data.data,
                labels: this.time_axis_type ?
                    data.labels[0] :
                    [...Array(this.max_test_on_chart)].map((_, i) => `group ${i + 1}`)
            }, {
                // tooltip: get_tooltip_options(
                //     this.aggregated_data.aggregated_tests,
                //     this.aggregated_data.names
                // ),
            })
        },
        need_grouping(tests) {
            return tests.length > this.max_test_on_chart
        },
        handle_image_download() {
            const a = document.createElement('a')
            a.href = window.charts.expanded_chart.toBase64Image()
            a.download = `analytics_${window.charts.expanded_chart.options.plugins.title.text}.png`.replace(
                ' - ', '_').replace(' ', '_').toLowerCase()
            a.click()
            a.remove()
        },
        get_aggregated_dataset(grouped_data) {
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
            grouped_data.forEach(group => {
                let dataset
                if (group.hasOwnProperty(this.data_node)) {
                    // for plain metrics
                    dataset = group[this.data_node]
                    struct.data.min.push(aggregation_callback_map.min(dataset))
                    struct.data.max.push(aggregation_callback_map.max(dataset))
                } else if (group.aggregations.hasOwnProperty(this.data_node)) {
                    dataset = group.aggregations[this.data_node]
                    struct.data.min.push(this.aggregation_callback(group.aggregations.min))
                    struct.data.max.push(this.aggregation_callback(group.aggregations.max))
                } else {
                    dataset = null
                    struct.data.min.push(null)
                    struct.data.max.push(null)
                    console.warn('No data "', this.data_node, '" in ', group)
                    // return
                }
                switch (this.data_node) {
                    case 'min':
                        struct.data.main = struct.data.min
                        break
                    case 'max':
                        struct.data.main = struct.data.max
                        break
                    default:
                        struct.data.main.push(this.aggregation_callback(dataset))
                        break
                }
                struct.labels.push(group.start_time)
                struct.aggregated_tests.push(group.aggregated_tests)
                struct.names.push(group.name)
            })
            return struct
        },
    },
    computed: {
        aggregation_callback() {
            return aggregation_callback_map[this.chart_aggregation] || aggregation_callback_map.mean
        },
        aggregated_data() {
            if (this.time_axis_type) {
                return this.get_aggregated_dataset(
                    group_data_by_timeline(this.filtered_tests, this.time_groups, {ui_metric_key: this.selected_metric_ui})
                )
            } else {
                return this.get_aggregated_dataset(
                    group_data(this.filtered_tests, this.max_test_on_chart, {ui_metric_key: this.selected_metric_ui})
                )
            }
        },
        tests_need_grouping() {
            return this.need_grouping(this.filtered_tests)
        },
        time_groups() {
            return this.filtered_tests.length === 0 ? [] : calculate_time_groups(
                this.filtered_tests.at(0).start_time,
                this.filtered_tests.at(-1).start_time,
                this.max_test_on_chart
            )
        },
        time_axis_type() {
            return this.axis_type === 'time'
        },
        split_by_test() {
            return this.dataset_type !== 'aggregated'
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
                <div v-if="window.location.search.indexOf('test') > -1">
                    <pre><button @click="tmp1 = {}">X</button>[[ tmp1 ]]</pre>
                    <pre><button @click="tmp2 = {}">X</button>[[ tmp2 ]]</pre>
                </div>
                
                <div class="d-flex flex-grow-1 filter-container chart_controls align-items-end">
                    <label class="d-inline-flex flex-column">
                        <span class="font-h6">Max points:</span>
                        <input type="number" v-model="max_test_on_chart" class="form-control max_points_input">
                    </label>
                    <label class="d-inline-flex flex-column">
                        <span class="font-h6">Chart aggr.:</span>
                        <select class="selectpicker"
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
                    </label>
                    <label class="d-inline-flex flex-column">
                        <span class="font-h6">Axis:</span>
                        <TextToggle
                            v-model="axis_type"
                            :labels='["categorical", "time"]'
                            radio_group_name="expanded_axis_type"
                        ></TextToggle>
                    </label>
                    <label class="d-inline-flex flex-column">
                        <span class="font-h6">Datasets:</span>
                        <TextToggle
                            v-model="dataset_type"
                            :labels='["aggregated", "split by test"]'
                            radio_group_name="expanded_dataset_type"
                        ></TextToggle>
                    </label>
                    <div class="selectpicker-titled">
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
                    <div class="flex-grow-1">
                    </div>
                    <button class="btn btn-secondary btn-icon" @click="handle_image_download">
                        <i class="fa fa-download"></i>
                    </button>
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