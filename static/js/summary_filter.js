const ColorfulCards = {
    delimiters: ['[[', ']]'],
    props: ['card_data', 'backend_metric_name', 'ui_metric_name', 'ui_aggregation_name'],
    methods: {
        compute_average(key) {
            return (this.card_data.sums[key] / this.card_data.counters[key]).toFixed(2)
        }
    },
    template: `
    <div class="d-flex mt-3 colorful-cards">
        <div class="col">
            <div class="card card-sm card-blue">
                <div class="card-header">
                    <span v-if="card_data?.sums.throughput !== undefined">
                        [[ compute_average('throughput') ]] req/sec
                    </span>
                    <span v-else>-</span>
                </div>
                <div class="card-body">AVR. THROUGHPUT</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-red">
                <div class="card-header">
                    <span v-if="card_data?.sums.error_rate !== undefined">
                        [[ compute_average('error_rate') ]]%
                    </span>
                    <span v-else>-</span>
                </div>
                <div class="card-body">ERROR RATE</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-azure">
                <div class="card-header">
                    <span v-if="card_data?.sums.aggregation_backend !== undefined">
                        [[ compute_average('aggregation_backend') ]] ms
                    </span>
                    <span v-else>-</span>
                </div>
                
                <div class="card-body">
                    <span v-if="card_data?.sums.aggregation_backend !== undefined">
                        [[ backend_metric_name ]]
                    </span>
                    <span v-else>-</span>
                </div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-magento">
                <div class="card-header">
                    <span v-if="card_data?.sums.response_time !== undefined">
                        [[ compute_average('response_time') ]] ms
                    </span>
                    <span v-else>-</span>
                </div>
                <div class="card-body">AVR. RESPONSE TIME</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-orange">
                <div class="card-header">
                    <span v-if="card_data?.sums.aggregation_ui !== undefined">
                        [[ compute_average('aggregation_ui') ]] ms
                    </span>
                    <span v-else>-</span>
                </div>
                <div class="card-body">
                    [[ ui_metric_name || '-' ]]
                </div>
            </div>
        </div>
    </div>
    `
}

const ChartSection = {
    props: ['tests', 'selected_aggregation_backend', 'selected_aggregation_ui'],
    delimiters: ['[[', ']]'],
    components: {
        ExpandedChart: ExpandedChart
    },

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
            time_axis_type: false,
        }
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
            if (this.time_axis_type) {
                // we assume that tests are sorted asc by time
                const time_groups = calculate_time_groups(
                    this.filtered_backend_tests.at(0).start_time,
                    this.filtered_backend_tests.at(-1).start_time,
                    this.max_test_on_chart
                )
                return group_data_by_timeline(this.filtered_backend_tests, time_groups)
            } else {
                return group_data(this.filtered_backend_tests, this.max_test_on_chart)
            }
        },
        aggregated_data_backend() {
            return aggregate_data(this.grouped_data_backend, this.selected_aggregation_backend, this.chart_aggregation)
        },
        backend_tests_need_grouping() {
            return this.filtered_backend_tests.length > this.max_test_on_chart || this.time_axis_type
        },
    },
    methods: {
        refresh_pickers() {
            $(this.$el).find('.selectpicker').selectpicker('redner').selectpicker('refresh')
        },
        handle_expand_chart(event) {
            const chart_name = event.target.tagName === 'I' ?
                event.target.parentElement.dataset.chart_name :
                event.target.dataset.chart_name
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
                    // this.expanded_chart_data = this.filtered_ui_tests
                    // this.expanded_chart_data_node = chart_name
                    this.expanded_chart.data = this.filtered_ui_tests
                    this.expanded_chart.data_node = chart_name
                } else {
                    // this.expanded_chart_data = this.filtered_backend_tests
                    // this.expanded_chart_data_node = chart_name === 'response_time' ? this.selected_aggregation_backend : chart_name
                    this.expanded_chart.data = this.filtered_backend_tests
                    this.expanded_chart.data_node = chart_name === 'response_time' ?
                        this.selected_aggregation_backend : chart_name
                }
                this.expanded_chart.show = true
                // window.charts.expanded_chart.update()
                // $('#expanded_chart_backdrop').modal('show')
            } else {
                showNotify('ERROR', `No chart named ${chart_name} found`)
            }
        },
        handle_update_backend_charts() {
            const throughput_datasets = prepare_datasets(
                window.charts.throughput,
                this.aggregated_data_backend.throughput,
                this.backend_tests_need_grouping,
                // true,
                `metric[${this.selected_aggregation_backend_mapped}]`
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

            const error_rate_datasets = prepare_datasets(
                window.charts.error_rate,
                this.aggregated_data_backend.error_rate,
                this.backend_tests_need_grouping,
                // true,
                `metric[${this.selected_aggregation_backend_mapped}]`
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

            // const response_time_datasets = []
            // this.backend_tests_need_grouping && response_time_datasets.push({
            //     ...dataset_max(get_gradient_max(window.charts.response_time)),
            //     data: this.aggregated_data_backend.aggregation.max
            // })
            // response_time_datasets.push({
            //     ...dataset_main(`metric[${this.selected_aggregation_backend_mapped}]`),
            //     data: this.aggregated_data_backend.aggregation.main
            // })
            // this.backend_tests_need_grouping && response_time_datasets.push({
            //     ...dataset_min(get_gradient_min(window.charts.response_time)),
            //     data: this.aggregated_data_backend.aggregation.min
            // })
            // window.charts.response_time.options.plugins.title.text = `RESPONSE TIME - ${this.selected_aggregation_backend}`
            // // window.charts.response_time.options.plugins.subtitle = {
            // //     display: true,
            // //     text: this.selected_aggregation_backend,
            // //     align: 'center',
            // // }
            // window.charts.response_time.data = {
            //     datasets: response_time_datasets,
            //     labels: this.aggregated_data_backend.labels,
            // }
            // window.charts.response_time.options.plugins.tooltip = get_tooltip_options(
            //     this.aggregated_data_backend.aggregated_tests,
            //     this.aggregated_data_backend.names
            // )
            // window.charts.response_time.update()
            const response_time_datasets = prepare_datasets(
                window.charts.response_time,
                this.aggregated_data_backend.aggregation,
                // this.backend_tests_need_grouping,
                true,
                `metric[${this.selected_aggregation_backend_mapped}]`
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
                    text: `RESPONSE TIME - ${this.selected_aggregation_backend}`,
                    align: 'start',
                }
            })
        },
        handle_update_ui_charts() {
            const datasets = []
            // this.backend_tests_need_grouping && datasets.push({
            //     ...dataset_max(get_gradient_max(window.charts.page_speed)),
            //     data: this.aggregated_data_backend.throughput.max
            // })
            datasets.push({
                ...dataset_main(`metric[${this.selected_aggregation_ui_mapped}]`),
                data: this.filtered_ui_tests.map(i => {
                    const metric_data = i.metrics[this.selected_metric_ui]
                    return metric_data && metric_data[this.selected_aggregation_ui]
                }),
            })
            // this.backend_tests_need_grouping && datasets.push({
            //     ...dataset_min(get_gradient_min(window.charts.page_speed)),
            //     data: this.aggregated_data_backend.throughput.min
            // })

            window.charts.page_speed.data = {
                datasets: datasets,
                labels: this.filtered_ui_tests.map(i => i.start_time),
            }
            // const title_opts = get_common_chart_options().options.plugins.title
            // title_opts.text = `PAGE SPEED - ${this.selected_metric_ui_mapped} - ${this.selected_aggregation_ui_mapped}`
            // window.charts.page_speed.options.plugins.title = title_opts
            window.charts.page_speed.options.plugins.title = `PAGE SPEED - ${this.selected_metric_ui_mapped} - ${this.selected_aggregation_ui_mapped}`
            // window.charts.page_speed.options.plugins.subtitle = {
            //     display: true,
            //     text: `${this.selected_metric_ui_mapped} : ${this.selected_aggregation_ui_mapped}`,
            //     align: 'center',
            // }
            // window.charts.page_speed.options.plugins.tooltip = get_tooltip_options(
            //     this.aggregated_data_backend.aggregated_tests,
            //     this.aggregated_data_backend.names
            // )
            window.charts.page_speed.update()
        },
        handle_update_charts() {
            this.handle_update_backend_charts()
            this.handle_update_ui_charts()
        },
    },
    template: `
<div>
    <div class="selectpicker-titled mt-3 d-inline-flex">
        <label class="d-inline-flex flex-column">
            Max points on chart
            <input type="number" v-model="max_test_on_chart" @change="handle_update_charts" class="form-control">
        </label>
        <label class="d-inline-flex flex-column">
            Chart aggregation
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
            Axis type
            <div class="d-inline-flex filter-container align-items-center">
                <span>categorical</span>
                    <label class="custom-toggle mt-0">
                        <input type="checkbox" v-model="time_axis_type">
                        <span class="custom-toggle_slider round"></span>
                    </label>
                <span>time</span>
            </div>
        </label>
    </div>
    
    <div class="d-flex justify-content-between my-3">
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    data-chart_name="throughput"
                    @click="registered_components.summary_filter?.handle_expand_chart"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="throughput_chart"></canvas>
        </div>
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    data-chart_name="error_rate"
                    @click="registered_components.summary_filter?.handle_expand_chart"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="error_rate_chart"></canvas>
        </div>
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    data-chart_name="response_time"
                    @click="registered_components.summary_filter?.handle_expand_chart"
            >
                <i class="fa fa-magnifying-glass-plus"></i>
            </button>
            <canvas id="response_time_chart"></canvas>
        </div>
        <div class="chart-container">
            <button type="button" class="btn btn-secondary btn-sm btn-icon__sm"
                    data-chart_name="page_speed"
                    @click="registered_components.summary_filter?.handle_expand_chart"
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
        :initial_time_axis_type="time_axis_type"
        :data_node="expanded_chart.data_node"
        :title="expanded_chart.title"
    ></ExpandedChart>
</div>
    `
}


const aggregation_backend_name_map = {}
const aggregation_ui_name_map = {}

const SummaryFilter = {
    delimiters: ['[[', ']]'],
    components: {
        ColorfulCards: ColorfulCards,
        ChartSection: ChartSection,
    },
    data() {
        return {
            all_data: [],
            is_loading: false,
            groups: [],
            selected_groups: [],
            tests: [],
            selected_tests: [],
            test_types: [],
            selected_test_types: [],
            test_envs: [],
            selected_test_envs: [],
            selected_aggregation_backend: 'pct95',
            selected_aggregation_ui: 'mean',
            selected_metric_ui: 'total',
            start_time: 'last_month',
            end_time: undefined,
            selected_filters: [],
        }
    },
    async mounted() {
        await this.fetch_data()
        window.tst = this // todo: temp for tests. REMOVE
    },
    watch: {
        all_data(newValue) {
            this.groups = Array.from(newValue.reduce((accum, item) => accum.add(item.group), new Set()))
            // change selected group dropdown
            this.selected_groups = newValue.length > 0 ? ['all'] : []

            this.$nextTick(this.refresh_pickers)
        },
        selected_groups(newValue, oldValue) {
            // handle select all
            if (newValue.includes('all') && !oldValue.includes('all')) {
                this.selected_groups = ['all']
                return
            } else if (newValue.includes('all') && newValue.length > 1) {
                newValue.splice(newValue.indexOf('all'), 1)
            }
            this.tests = Array.from(this.all_data.reduce((accum, item) => {
                (newValue.includes('all') || newValue.includes(item.group)) &&
                accum.add(`${item.group.slice(0, 2)}${page_constants.test_name_delimiter}${item.name}`)
                return accum
            }, new Set()))

            this.handle_filter_changed()
        },
        tests(newValue) {
            // change selected test dropdown
            this.selected_tests = newValue.length > 0 ? ['all'] : []
            this.$nextTick(this.refresh_pickers)
        },
        selected_tests(newValue, oldValue) {
            // handle select all
            if (newValue.includes('all') && !oldValue.includes('all')) {
                this.selected_tests = ['all']
                return
            } else if (newValue.includes('all') && newValue.length > 1) {
                newValue.splice(newValue.indexOf('all'), 1)
            }
            const test_types = new Set()
            const test_envs = new Set()
            this.all_data.map(item => {
                if (
                    (this.selected_groups.includes(item.group) || this.selected_groups.includes('all'))
                    &&
                    (this.selected_tests_names.includes(item.name) || this.selected_tests_names.includes('all'))
                ) {
                    test_types.add(item.test_type)
                    test_envs.add(item.test_env)
                }
            })
            this.test_types = Array.from(test_types)
            this.test_envs = Array.from(test_envs)
            this.handle_filter_changed()
        },
        test_types(newValue) {
            // change test_types dropdown
            this.selected_test_types = newValue.length > 0 ? ['all'] : []
            this.$nextTick(this.refresh_pickers)
        },
        test_envs(newValue) {
            // change test_envs dropdown
            this.selected_test_envs = newValue.length > 0 ? ['all'] : []
            this.$nextTick(this.refresh_pickers)
        },
        selected_test_types(newValue, oldValue) {
            // handle select all
            if (newValue.includes('all') && !oldValue.includes('all')) {
                this.selected_test_types = ['all']
                return
            } else if (newValue.includes('all') && newValue.length > 1) {
                newValue.splice(newValue.indexOf('all'), 1)
            }
            this.$nextTick(this.refresh_pickers)
            this.handle_filter_changed()
        },
        selected_test_envs(newValue, oldValue) {
            // handle select all
            if (newValue.includes('all') && !oldValue.includes('all')) {
                this.selected_test_envs = ['all']
                return
            } else if (newValue.includes('all') && newValue.length > 1) {
                newValue.splice(newValue.indexOf('all'), 1)
            }
            this.$nextTick(this.refresh_pickers)
            this.handle_filter_changed()
        },
        async start_time(newValue) {
            await this.fetch_data()
        },
        selected_aggregation_backend() {
            this.handle_update_backend_charts()
        },
        selected_aggregation_ui() {
            this.handle_update_ui_charts()
        },
        selected_metric_ui() {
            this.handle_update_ui_charts()
        },

    },
    methods: {
        refresh_pickers() {
            $(this.$el).find('.selectpicker').selectpicker('redner').selectpicker('refresh')
        },
        async fetch_data() {
            this.is_loading = true
            const resp = await fetch(
                api_base + '/performance_analysis/filter/' + getSelectedProjectId() + '?' + new URLSearchParams(
                    this.timeframe
                )
            )
            if (resp.ok) {
                this.all_data = await resp.json()
                this.all_data.push({
                    metrics: {
                        total: {
                            mean: 123,
                        }
                    },
                    "duration": 95,
                    "group": page_constants.ui_name,
                    "name": "mocked_ui_test",
                    "start_time": "2022-08-19T09:04:52.479000Z",
                    "status": "Finished",
                    "tags": ['some_tag_1', 'some_tag_2'],
                    "test_env": "mocked_1",
                    "test_type": "mocked_1",

                }) // todo: remove
            } else {
                showNotify('ERROR', 'Error fetching groups')
            }
            this.is_loading = false
        },
        handle_apply_click() {
            this.handle_filter_changed()
        },

        handle_filter_changed() {
            vueVm.registered_components.table_reports?.table_action('load', this.filtered_tests)
            // this.handle_update_charts()
        },

    },
    computed: {
        backend_test_selected() {
            return (
                this.selected_groups.includes('all') || this.selected_groups.includes(page_constants.backend_name)
            ) && this.groups.includes(page_constants.backend_name)
        },
        ui_test_selected() {
            return (
                this.selected_groups.includes('all') || this.selected_groups.includes(page_constants.ui_name)
            ) && this.groups.includes(page_constants.ui_name)
        },
        selected_tests_names() {
            return this.selected_tests.map(i => i === 'all' ? 'all' : i.split(page_constants.test_name_delimiter)[1])
        },
        filtered_tests() {
            return this.all_data.filter(i => {
                return (this.selected_groups.includes('all') || this.selected_groups.includes(i.group))
                    &&
                    (this.selected_tests_names.includes('all') || this.selected_tests_names.includes(i.name))
                    &&
                    (this.selected_test_types.includes('all') || this.selected_test_types.includes(i.test_type))
                    &&
                    (this.selected_test_envs.includes('all') || this.selected_test_envs.includes(i.test_env))
            })
        },

        timeframe() {
            switch (this.start_time) {
                // todo: place real date frames here
                case 'last_week':
                    this.end_time = undefined
                    return {start_time: '2021-09-23T15:42:59.108Z'}
                case 'last_month':
                    this.end_time = undefined
                    return {start_time: '2021-09-23T15:42:59.108Z'}
                default: // e.g. if start time is from timepicker
                    return {start_time: this.start_time, end_time: this.end_time}
            }
        },
        colorful_cards_data() {
            const increment_accum = (accum, key, value) => {
                if (value !== undefined) {
                    accum.sums[key] = accum.sums[key] === undefined ? value : accum.sums[key] + value
                    accum.counters[key] = accum.counters[key] === undefined ? 1 : accum.counters[key] + 1
                }
            }
            return this.filtered_tests.reduce((accum, item) => {
                switch (item.group) {
                    case page_constants.backend_name:
                        increment_accum(accum, 'aggregation_backend', item.aggregations[this.selected_aggregation_backend])
                        Array.from([
                            'throughput',
                            'error_rate',
                        ]).forEach(i => increment_accum(accum, i, item.metrics[i]))
                        increment_accum(accum, 'response_time', item.aggregations.mean)
                        break
                    case page_constants.ui_name:
                        const metric_data = item[this.selected_metric_ui]
                        metric_data && increment_accum(accum, 'aggregation_ui', metric_data?.aggregations[this.selected_aggregation_ui])
                        break
                    default:
                }
                return accum
            }, {
                counters: {},
                sums: {}
            })
        },
        selected_aggregation_backend_mapped() {
            return aggregation_backend_name_map[this.selected_aggregation_backend]
                || this.selected_aggregation_backend
        },
        selected_aggregation_ui_mapped() {
            return aggregation_ui_name_map[this.selected_aggregation_ui]
                || this.selected_aggregation_ui
        },
        selected_metric_ui_mapped() {
            return aggregation_ui_name_map[this.selected_metric_ui]
                || this.selected_metric_ui
        },

        // tmp() {
        //     return this.filtered_backend_tests.length > 0 && calculate_time_groups(
        //         this.filtered_backend_tests.at(0).start_time,
        //         this.filtered_backend_tests.at(-1).start_time,
        //         this.max_test_on_chart,
        //         false
        //         ).map(i => i.toLocaleString())
        // }
    },
    template: `
<div>
<!--    <div class="d-flex" style="background-color: #80808080">-->
<!--            <div class="d-flex flex-grow-1">-->
<!--                DEBUG || -->
<!--                is_loading: [[ is_loading ]] || -->
<!--                selected_filters: [[ selected_filters ]] ||-->
<!--                expanded_chart: [[ expanded_chart.show ]] [[ expanded_chart.title ]] [[ expanded_chart.data_node ]]-->
<!--            </div>-->
<!--            <div class="d-flex flex-grow-1">-->
<!--                <label>-->
<!--                    Max tests on chart-->
<!--                    <input type="number" v-model="max_test_on_chart" @change="handle_update_charts" class="form-control">-->
<!--                </label>-->
<!--            </div>-->
<!--    </div>-->
<!--    <div class="d-flex" style="background-color: #80808080">-->
<!--        <div class="d-flex flex-grow-1">-->
<!--            time groups: <pre>[[ tmp ]]</pre>-->
<!--        </div>-->
<!--        <div class="d-flex flex-grow-1">-->
<!--            tests times: <pre>[[ filtered_backend_tests.map(i => new Date(i.start_time).toLocaleString()) ]]</pre>-->
<!--        </div>-->
<!--    </div>-->
<!--    <div class="d-flex" style="background-color: #80808080">-->
<!--        <div class="d-flex flex-grow-1">-->
<!--            <pre>[[ grouped_data_backend ]]</pre>-->
<!--        </div>-->
<!--        <div class="d-flex flex-grow-1">-->
<!--            <pre>[[ aggregated_data_backend ]]</pre>-->
<!--        </div>-->
<!--    </div>-->
    
    <div class="d-flex flex-wrap filter-container">
        <div class="selectpicker-titled">
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">group</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                multiple
                v-model="selected_groups"
            >
                <option value="all" v-if="groups.length > 0">All</option>
                <option v-for="i in groups" :value="i" :key="i">[[ i ]]</option>
            </select>
        </div>

        <div class="selectpicker-titled">
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">test</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                multiple
                :disabled="tests.length === 0"
                v-model="selected_tests"
            >
                <option value="all" v-if="tests.length > 0">All</option>
                <option v-for="i in tests" :value="i" :key="i">[[ i ]]</option>
            </select>
        </div>

        <div class="selectpicker-titled">
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">type</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                multiple
                :disabled="selected_tests.length === 0"
                v-model="selected_test_types"
            >
                <option value="all">All</option>
                <option v-for="i in test_types" :value="i" :key="i">[[ i ]]</option>
            </select>
        </div>

        <div class="selectpicker-titled">
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">env.</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                multiple
                :disabled="selected_tests.length === 0"
                v-model="selected_test_envs"
            >
                <option value="all">All</option>
                <option v-for="i in test_envs" :value="i" :key="i">[[ i ]]</option>
            </select>
        </div>

        <div class="selectpicker-titled" 
            v-show="selected_filters.includes('Backend Aggregation')"
        >
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">aggr. BE</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                :disabled="!backend_test_selected"
                v-model="selected_aggregation_backend"
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
        
        <div class="selectpicker-titled" 
            v-show="selected_filters.includes('UI Metric')"
        >
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">UI metric</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                :disabled="!ui_test_selected"
                v-model="selected_metric_ui"
            >
                <option value="total">Total Time</option>
                <option value="time_to_first_byte">Time To First Byte</option>
                <option value="time_to_first_paint">Time To First Paint</option>
                <option value="dom_content_loading">Dom Content Load</option>
                <option value="dom_processing">Dom Processing</option>
                <option value="speed_index">Speed Index</option>
                <option value="time_to_interactive">Time To Interactive</option>
                <option value="first_contentful_paint">First Contentful Paint</option>
                <option value="largest_contentful_paint">Largest Contentful Paint</option>
                <option value="cumulative_layout_shift">Cumulative Layout Shift</option>
                <option value="total_blocking_time">Total Blocking Time</option>
                <option value="first_visual_change">First Visual Change</option>
                <option value="last_visual_change">Last Visual Change</option>
            </select>
        </div>
        
        <div class="selectpicker-titled" 
            v-show="selected_filters.includes('UI Aggregation')"
        >
            <span class="font-h6 font-semibold px-3 item__left text-uppercase">aggr. UI</span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                :disabled="!ui_test_selected"
                v-model="selected_aggregation_ui"
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

        <div class="selectpicker-titled">
            <span class="font-h6 font-semibold px-3 item__left fa fa-calendar"></span>
            <select class="selectpicker flex-grow-1" data-style="item__right"
                v-model="start_time"
            >
                <option value="last_month">Last Month</option>
                <option value="last_week">Last Week</option>
            </select>
        </div>

        <MultiselectDropdown
            variant="slot"
            :list_items='["Backend Aggregation", "UI Metric", "UI Aggregation"]'
            :pre_selected_indexes='[0, 1, 2]'
            button_class="btn-icon btn-secondary"
            @change="selected_filters = $event"
        >
            <template #dropdown_button><i class="fa fa-filter"></i></template>
        </MultiselectDropdown>

        <button class="btn btn-basic"
            @click="handle_apply_click"
            :disabled="is_loading"
        >Apply</button>
    </div>
    
    <ColorfulCards
        :card_data="colorful_cards_data"
        :backend_metric_name="selected_aggregation_backend_mapped"
        :ui_metric_name="selected_metric_ui_mapped"
        :ui_aggregation_name="selected_aggregation_ui_mapped"
    ></ColorfulCards>
    
    <ChartSection
        :tests="filtered_tests"
        :selected_aggregation_backend="selected_aggregation_backend"
        :selected_aggregation_ui="selected_aggregation_ui"
    ></ChartSection>
    
</div>
    `
}

register_component('SummaryFilter', SummaryFilter)



