const ChartSection = {
    props: ['tests', 'selected_aggregation_backend', 'selected_aggregation_ui', 'selected_metric_ui'],
    delimiters: ['[[', ']]'],
    data() {
        return {
            chart_aggregation: 'mean',
            max_test_on_chart: 6,
            expanded_chart: {
                show: false,
                data: [],
                data_node: '',
                title: ''
            },
            axis_type: 'categorical',
            loaded: {
                throughput_chart: false,
                error_rate_chart: false,
                response_time_chart: false,
                page_speed_chart: false,
            }
        }
    },
    mounted() {
        $(() => {
            const get_small_chart_options = () => {
                const opts = get_common_chart_options()
                opts.options.scales.x.ticks.maxTicksLimit = 6
                opts.options.maintainAspectRatio = false
                // opts.options.aspectRatio = 1
                return opts
            }
            let chart_options = get_small_chart_options()
            chart_options.options.scales.y.title.text = 'req/sec'
            chart_options.options.plugins.title.text = 'AVG. THROUGHPUT'
            window.charts.throughput = new Chart('throughput_chart', chart_options)
            this.loaded.throughput_chart = true

            chart_options = get_small_chart_options()
            chart_options.options.scales.y.title.text = '%'
            chart_options.options.plugins.title.text = 'ERROR RATE'
            window.charts.error_rate = new Chart('error_rate_chart', chart_options)
            this.loaded.error_rate_chart = true

            chart_options = get_small_chart_options()
            chart_options.options.scales.y.title.text = 'ms'
            chart_options.options.plugins.title.text = 'RESPONSE TIME'
            window.charts.response_time = new Chart('response_time_chart', chart_options)
            this.loaded.response_time_chart = true

            chart_options = get_small_chart_options()
            chart_options.options.scales.y.title.text = 'ms'
            chart_options.options.plugins.title.text = 'PAGE SPEED'
            window.charts.page_speed = new Chart('page_speed_chart', chart_options)
            this.loaded.page_speed_chart = true

            this.handle_update_charts()
        })

    },
    watch: {
        chart_aggregation() {
            this.handle_update_charts()
        },
        time_axis_type(newValue) {
            Object.values(window.charts).forEach(i => {
                i.options.scales.x.type = newValue ? 'time' : 'category'
            })
            this.handle_update_charts()
        },
        filtered_backend_tests(newValue) {
            this.loaded.throughput_chart &&
            this.loaded.response_time_chart &&
            this.loaded.error_rate_chart && this.handle_update_backend_charts()
        },
        filtered_ui_tests(newValue) {
            this.loaded.page_speed_chart && this.handle_update_ui_charts()
        },
        selected_aggregation_backend() {
            this.handle_update_backend_charts()
        },
        selected_aggregation_ui() {
            this.handle_update_ui_charts()
        },
        selected_metric_ui() {
            this.handle_update_ui_charts()
        }
    },
    computed: {
        filtered_backend_tests() {
            return this.tests.filter(
                i => i.group === page_constants.backend_name
            )
        },
        filtered_ui_tests() {
            return this.tests.filter(
                i => i.group === page_constants.ui_name
            )
        },
        grouped_data_backend() {
            return this.get_grouped_data(this.filtered_backend_tests)
        },
        grouped_data_ui() {
            return this.get_grouped_data(this.filtered_ui_tests)
        },
        aggregated_data_backend() {
            return aggregate_data(this.grouped_data_backend, this.selected_aggregation_backend, this.chart_aggregation)
        },
        aggregated_data_ui() {
            return aggregate_data(this.grouped_data_ui, this.selected_aggregation_ui, this.chart_aggregation)
        },
        backend_tests_need_grouping() {
            return this.filtered_backend_tests.length > this.max_test_on_chart || this.time_axis_type
        },
        ui_tests_need_grouping() {
            return this.filtered_ui_tests.length > this.max_test_on_chart || this.time_axis_type
        },
        time_axis_type() {
            return this.axis_type === 'time'
        }
    },
    methods: {
        refresh_pickers() {
            $(this.$el).find('.selectpicker').selectpicker('redner').selectpicker('refresh')
        },
        handle_expand_chart_event(event) {
            // const event = {
            //     target: {
            //         dataset: {
            //             chart_name: chart_name
            //         }
            //     }
            // }
            const chart_name = event.target.tagName === 'I' ?
                event.target.parentElement.dataset.chart_name :
                event.target.dataset.chart_name
            this.handle_expand_chart(chart_name)
        },
        handle_expand_chart(chart_name) {
            const chart = window.charts[chart_name]
            if (chart) {
                // Object.assign(window.charts.expanded_chart.options, chart.config.options)
                // window.charts.expanded_chart.options.plugins.title.text = chart.config.options.plugins.title.text
                this.expanded_chart.title = chart.config.options.plugins.title.text
                // window.charts.expanded_chart.options.plugins.tooltip = chart.config.options.plugins.tooltip
                // Object.assign(window.charts.expanded_chart.data, chart.config.data)
                // window.charts.expanded_chart.options.scales.x.ticks.maxTicksLimit = 11
                // const group = ['throughput', 'error_rate', ''].includes(chart_name) ?
                //     page_constants.backend_name : page_constants.ui_name
                // this.expanded_chart_data = this.filtered_tests.filter(i => {
                //     return i.group === group &&
                // })
                if (chart_name === 'page_speed') {
                    this.expanded_chart.data = this.filtered_ui_tests
                    this.expanded_chart.data_node = this.selected_aggregation_ui
                } else {
                    this.expanded_chart.data = this.filtered_backend_tests
                    this.expanded_chart.data_node = chart_name === 'response_time' ?
                        this.selected_aggregation_backend : chart_name
                }
                this.expanded_chart.show = true
            } else {
                showNotify('ERROR', `No chart named ${chart_name} found`)
            }
        },
        handle_update_throughput() {
            const throughput_datasets = prepare_datasets(
                window.charts.throughput,
                this.aggregated_data_backend.throughput,
                this.backend_tests_need_grouping,
                // true,
                `metric[${get_mapped_name(this.selected_aggregation_backend)}]`
            )
            update_chart(window.charts.throughput, {
                datasets: throughput_datasets,
                labels: this.aggregated_data_backend.labels
            }, {
                tooltip: get_tooltip_options(
                    this.aggregated_data_backend.aggregated_tests,
                    this.aggregated_data_backend.names
                )
            })
        },
        handle_update_error_rate() {
            const error_rate_datasets = prepare_datasets(
                window.charts.error_rate,
                this.aggregated_data_backend.error_rate,
                this.backend_tests_need_grouping,
                // true,
                `metric[${get_mapped_name(this.selected_aggregation_backend)}]`
            )
            update_chart(window.charts.error_rate, {
                datasets: error_rate_datasets,
                labels: this.aggregated_data_backend.labels
            }, {
                tooltip: get_tooltip_options(
                    this.aggregated_data_backend.aggregated_tests,
                    this.aggregated_data_backend.names
                )
            })
        },
        handle_update_response_time() {
            const response_time_datasets = prepare_datasets(
                window.charts.response_time,
                this.aggregated_data_backend.aggregation,
                // this.backend_tests_need_grouping,
                true,
                `metric[${get_mapped_name(this.selected_aggregation_backend)}]`
            )
            update_chart(window.charts.response_time, {
                datasets: response_time_datasets,
                labels: this.aggregated_data_backend.labels
            }, {
                tooltip: get_tooltip_options(
                    this.aggregated_data_backend.aggregated_tests,
                    this.aggregated_data_backend.names
                ),
                title: {
                    display: true,
                    text: `RESPONSE TIME - ${get_mapped_name(this.selected_aggregation_backend)}`,
                    // align: 'start',
                }
            })
        },
        handle_update_backend_charts() {
            this.handle_update_throughput()
            this.handle_update_error_rate()
            this.handle_update_response_time()
        },
        handle_update_ui_charts() {
            const datasets = prepare_datasets(
                window.charts.page_speed,
                this.aggregated_data_ui.aggregation,
                // this.ui_tests_need_grouping,
                true,
                `metric[${get_mapped_name(this.selected_aggregation_ui)}]`
            )
            update_chart(window.charts.page_speed, {
                datasets: datasets,
                labels: this.aggregated_data_ui.labels
            }, {
                tooltip: get_tooltip_options(
                    this.aggregated_data_ui.aggregated_tests,
                    this.aggregated_data_ui.names
                ),
                title: {
                    display: true,
                    text: `PAGE SPEED - ${get_mapped_name(this.selected_metric_ui)} - ${get_mapped_name(this.selected_aggregation_ui)}`,
                    // align: 'start',
                }
            })




            // const datasets = []
            // datasets.push({
            //     ...dataset_main(`metric[${get_mapped_name(this.selected_aggregation_ui)}]`),
            //     data: this.filtered_ui_tests.map(i => {
            //         const metric_data = i.metrics[this.selected_metric_ui]
            //         return metric_data && metric_data[this.selected_aggregation_ui]
            //     }),
            // })
            // window.charts.page_speed.data = {
            //     datasets: datasets,
            //     labels: this.filtered_ui_tests.map(i => i.start_time),
            // }
            // window.charts.page_speed.options.plugins.title = `PAGE SPEED - ${get_mapped_name(this.selected_metric_ui)} - ${get_mapped_name(this.selected_aggregation_ui)}`
            // window.charts.page_speed.options.plugins.subtitle = {
            //     display: true,
            //     text: `${this.selected_metric_ui_mapped} : ${this.selected_aggregation_ui_mapped}`,
            //     align: 'center',
            // }
            // window.charts.page_speed.update()
        },
        handle_update_charts() {
            this.handle_update_backend_charts()
            this.handle_update_ui_charts()
        },
        get_grouped_data(tests) {
            if (tests.length === 0) {
                return []
            }
            if (this.time_axis_type) {
                // we assume that tests are sorted asc by time
                const time_groups = calculate_time_groups(
                    tests.at(0).start_time,
                    tests.at(-1).start_time,
                    this.max_test_on_chart
                )
                return group_data_by_timeline(tests, time_groups, {ui_metric_key: this.selected_metric_ui})
            } else {
                return group_data(tests, this.max_test_on_chart, {ui_metric_key: this.selected_metric_ui})
            }
        },
    },
    template: `
<div>
    <div class="d-inline-flex mt-3 chart_controls filter-container">
        <label class="d-inline-flex flex-column">
            <span class="font-h6">Max points:</span>
            <input type="number" v-model="max_test_on_chart" @change="handle_update_charts" class="form-control max_points_input">
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
                radio_group_name="chart_group_axis_type"
            ></TextToggle>
        </label>
    </div>
    
    <div class="d-flex justify-content-between my-3">
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    @click="() => handle_expand_chart('throughput')"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="throughput_chart"></canvas>
        </div>
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    @click="() => handle_expand_chart('error_rate')"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="error_rate_chart"></canvas>
        </div>
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    @click="() => handle_expand_chart('response_time')"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="response_time_chart"></canvas>
        </div>
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    @click="() => handle_expand_chart('page_speed')"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="page_speed_chart"></canvas>
        </div>
    </div>
    
    <ExpandedChart
        modal_id="expanded_chart_backdrop"
        :filtered_tests="expanded_chart.data"
        v-model:show="expanded_chart.show"
        :initial_max_test_on_chart="max_test_on_chart"
        :initial_chart_aggregation="chart_aggregation"
        :initial_axis_type="axis_type"
        :data_node="expanded_chart.data_node"
        :title="expanded_chart.title"
        :selected_metric_ui="selected_metric_ui"
    ></ExpandedChart>
</div>
    `
}
register_component('ChartSection', ChartSection)