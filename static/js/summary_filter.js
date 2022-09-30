const api_base = '/api/v1'

const ColorfulCards = {
    delimiters: ['[[', ']]'],
    props: ['card_data', 'backend_metric_name', 'ui_metric_name'],
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
                    <span v-if="card_data?.sums.aggregation_ui !== undefined">
                        [[ ui_metric_name ]]
                    </span>
                    <span v-else>-</span>
                </div>
            </div>
        </div>
    </div>
    `
}

const SummaryFilter = {
    delimiters: ['[[', ']]'],
    components: {
        ColorfulCards: ColorfulCards,
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
            aggregation_backend_name_map: {},
            selected_aggregation_ui: 'min',
            aggregation_ui_name_map: {},
            start_time: 'last_month',
            end_time: undefined,
            constants: {
                ui_name: 'ui_performance',
                backend_name: 'backend_performance',
                test_name_delimiter: '::',
            },
            chart_aggregation: 'mean'
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
                accum.add(`${item.group.slice(0, 2)}${this.constants.test_name_delimiter}${item.name}`)
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
            this.handle_filter_changed()
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
            } else {
                showNotify('ERROR', 'Error fetching groups')
            }
            this.is_loading = false
        },
        handle_apply_click() {
            vueVm.registered_components.table_reports?.table_action('load', this.filtered_tests)
            this.handle_update_charts()
        },
        handle_update_charts() {
            const get_gradient_max = chart_obj => {
                const gradient = chart_obj.ctx.createLinearGradient(0, 20, 0, 120)
                gradient.addColorStop(0, 'red')
                gradient.addColorStop(0.8, 'orange')
                gradient.addColorStop(1, 'yellow')
                return gradient
            }
            const get_gradient_min = chart_obj => {
                const gradient = chart_obj.ctx.createLinearGradient(0, 0, 0, 20)
                gradient.addColorStop(0, 'blue')
                gradient.addColorStop(0.3, 'cyan')
                gradient.addColorStop(1, 'green')
                return gradient
            }

            const backend_labels = []
            const backend_dataset_min = []
            const backend_dataset_max = []
            this.filtered_tests.filter(
                i => i.group === this.constants.backend_name
            ).map(i => {
                backend_labels.push(i.start_time)
                backend_dataset_min.push(i.aggregations.min)
                backend_dataset_max.push(i.aggregations.max)
            })

            // todo: filter only tests with throughput (only backend)
            window.charts.throughput.data = {
                datasets: [
                    {
                        borderColor: '#5933c6',
                        pointBorderColor: '#5933c6',
                        pointBackgroundColor: '#5933c6',
                        pointHoverBackgroundColor: '#5933c6',
                        pointHoverBorderColor: '#5933c6',
                        data: this.filtered_tests.map(i => i.throughput)
                    },
                ],
                labels: backend_labels,
            }
            window.charts.throughput.update()

            window.charts.error_rate.data = {
                datasets: [{
                    borderColor: '#5933c6',
                    pointBorderColor: '#5933c6',
                    pointBackgroundColor: '#5933c6',
                    pointHoverBackgroundColor: '#5933c6',
                    pointHoverBorderColor: '#5933c6',
                    data: this.filtered_tests.map(i => i.error_rate)
                }],
                labels: backend_labels,

            }
            window.charts.error_rate.update()

            // gradientStroke = get_gradient(window.charts.response_time)
            const gradient_max = get_gradient_max(window.charts.response_time)
            const gradient_min = get_gradient_min(window.charts.response_time)
            window.charts.response_time.options.plugins.title.text = `RESPONSE TIME : ${this.selected_aggregation_backend}`
            window.charts.response_time.data = {
                datasets: [
                    {
                        borderColor: gradient_max,
                        pointBorderColor: gradient_max,
                        pointBackgroundColor: gradient_max,
                        pointHoverBackgroundColor: gradient_max,
                        pointHoverBorderColor: gradient_max,
                        borderDash: [5, 5],
                        borderWidth: 1,
                        fill: '+1',
                        backgroundColor: '#ff800020',
                        data: backend_dataset_max
                    },
                    {
                        borderColor: '#5933c6',
                        pointBorderColor: '#5933c6',
                        pointBackgroundColor: '#5933c6',
                        pointHoverBackgroundColor: '#5933c6',
                        pointHoverBorderColor: '#5933c6',
                        fill: false,
                        data: this.filtered_tests.map(i => i.aggregations[this.selected_aggregation_backend])
                    },
                    {
                        borderColor: gradient_min,
                        pointBorderColor: gradient_min,
                        pointBackgroundColor: gradient_min,
                        pointHoverBackgroundColor: gradient_min,
                        pointHoverBorderColor: gradient_min,
                        borderDash: [5, 5],
                        borderWidth: 1,
                        backgroundColor: '#00800020',
                        fill: '-1',
                        data: backend_dataset_min,
                    },
                ],
                labels: backend_labels,
            }
            window.charts.response_time.update()
        },
        handle_filter_changed() {
            this.handle_apply_click()
        },
    },
    computed: {
        backend_test_selected() {
            return this.selected_groups.includes('all') || this.selected_groups.includes(this.constants.backend_name)
        },
        ui_test_selected() {
            return this.selected_groups.includes('all') || this.selected_groups.includes(this.constants.ui_name)
        },
        selected_tests_names() {
            return this.selected_tests.map(i => i === 'all' ? 'all' : i.split(this.constants.test_name_delimiter)[1])
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
        // avg_throughput() {
        //     return this.filtered_tests.reduce(
        //         (prev, next) => prev.throughput || 0 + next.throughput || 0, 0
        //     ) / this.filtered_tests.length
        // },
        colorful_cards_data() {
            const increment_accum = (accum, key, value) => {
                if (value !== undefined) {
                    accum.sums[key] = accum.sums[key] === undefined ? value : accum.sums[key] + value
                    accum.counters[key] = accum.counters[key] === undefined ? 1 : accum.counters[key] + 1
                }
            }
            return this.filtered_tests.reduce((accum, item) => {
                item.group === this.constants.backend_name &&
                increment_accum(accum, 'aggregation_backend', item.aggregations[this.selected_aggregation_backend])
                item.group === this.constants.ui_name &&
                increment_accum(accum, 'aggregation_ui', item.aggregations[this.selected_aggregation_ui])
                increment_accum(accum, 'response_time', item.aggregations['mean'])

                Array.from([
                    'throughput',
                    'error_rate',
                ]).forEach(i => increment_accum(accum, i, item[i]))
                return accum
            }, {
                counters: {},
                sums: {}
            })
        }
    },
    template: `
<div>
    <div class="d-flex">
            <div class="d-flex flex-grow-1">
            is_loading: [[ is_loading ]]
            </div>
    </div>
    <div class="d-flex">
        <div class="d-flex justify-content-between flex-grow-1">

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">group</span>
                <select class="selectpicker flex-grow-1" data-style="item__right"
                    multiple
                    v-model="selected_groups"
                >
                    <option value="all" v-if="groups.length > 0">All</option>
                    <option v-for="i in groups" :value="i" :key="i">[[ i ]]</option>
                </select>
            </div>

            <div class="selectpicker-titled w-100">
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

            <div class="selectpicker-titled w-100">
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

            <div class="selectpicker-titled w-100">
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

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">aggr.</span>
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

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left fa fa-calendar"></span>
                <select class="selectpicker flex-grow-1" data-style="item__right"
                    v-model="start_time"
                >
                    <option value="last_month">Last Month</option>
                    <option value="last_week">Last Week</option>
                </select>
            </div>
        </div>

        <div class="mx-3">
            <button class="btn btn-secondary btn-icon"><i class="fa fa-filter"></i></button>
        </div>

        <button class="btn btn-basic"
            @click="handle_apply_click"
            :disabled="is_loading"
        >Apply</button>
    </div>
    <ColorfulCards
        :card_data="colorful_cards_data"
        :backend_metric_name="aggregation_backend_name_map[selected_aggregation_backend] || selected_aggregation_backend"
        :ui_metric_name="aggregation_ui_name_map[selected_aggregation_ui] || selected_aggregation_ui"
    ></ColorfulCards>
    
    <div class="selectpicker-titled mt-3 d-inline-flex">
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
</div>
    `
}

register_component('SummaryFilter', SummaryFilter)

$(() => {
    const get_common_chart_options = () => ({
        type: 'line',
        // responsive: true,
        options: {
            // maintainAspectRatio: false,
            // aspectRatio: 1,
            scales: {
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        // text: 'req/sec'
                    },
                    grid: {
                        display: false
                    },
                    // suggestedMin: 0
                },
                x: {
                    type: 'time',
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: true,
                        count: 5,
                        maxTicksLimit: 6
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    // text: 'AVG. THROUGHPUT',
                    align: 'start',
                    fullSize: false
                },
            },
        },
    })
    window.charts = {}

    let chart_options = get_common_chart_options()
    chart_options.options.scales.y.title.text = 'req/sec'
    chart_options.options.plugins.title.text = 'AVG. THROUGHPUT'
    window.charts.throughput = new Chart('throughput_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.y.title.text = '%'
    chart_options.options.plugins.title.text = 'ERROR RATE'
    window.charts.error_rate = new Chart('error_rate_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.y.title.text = 'ms'
    chart_options.options.plugins.title.text = 'RESPONSE TIME'
    chart_options.options.interaction = {
        mode: 'index',
        intersect: false
    }
    window.charts.response_time = new Chart('response_time_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.y.title.text = 'ms'
    chart_options.options.plugins.title.text = 'PAGE SPEED'
    window.charts.page_speed = new Chart('page_speed_chart', chart_options)
})

