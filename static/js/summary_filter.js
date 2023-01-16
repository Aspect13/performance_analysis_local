const ColorfulCards = {
    delimiters: ['[[', ']]'],
    props: ['card_data', 'selected_aggregation_backend', 'selected_aggregation_ui', 'selected_metric_ui'],
    methods: {
        compute_average(key) {
            return (this.card_data.sums[key] / this.card_data.counters[key]).toFixed(2)
        }
    },
    computed: {
        backend_metric_name() {
            return get_mapped_name(this.selected_aggregation_backend)
        },
        ui_metric_name() {
            return get_mapped_name(this.selected_aggregation_ui)
        },
        ui_aggregation_name() {
            return get_mapped_name(this.selected_metric_ui)
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
            selected_aggregation_ui: 'mean',
            selected_metric_ui: 'total',
            start_time: 'all',
            end_time: undefined,
            selected_filters: [],
        }
    },
    async mounted() {
        await this.fetch_data()
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
        // selected_aggregation_backend() {
        //     this.handle_update_backend_charts()
        // },
        // selected_aggregation_ui() {
        //     this.handle_update_ui_charts()
        // },
        // selected_metric_ui() {
        //     this.handle_update_ui_charts()
        // },

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
                // this.all_data.push({
                //     metrics: new Proxy({}, {
                //         get() {
                //             return {
                //                 max: 789,
                //                 mean: 456,
                //                 min: 123,
                //             }
                //         }
                //     }),
                //     "duration": 95,
                //     "group": page_constants.ui_name,
                //     "name": "mocked_ui_test",
                //     "start_time": new Date().toISOString(),
                //     "status": "Finished",
                //     "tags": ['some_tag_1', 'some_tag_2'],
                //     "test_env": "mocked_1",
                //     "test_type": "mocked_1",
                //     id: 0
                // }) // todo: remove
            } else {
                showNotify('ERROR', 'Error fetching groups')
            }
            this.is_loading = false
        },
        // handle_apply_click() {
        //     this.handle_filter_changed()
        // },

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
                case 'last_month':
                case 'all':
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
                        const metric_data = item.metrics[this.selected_metric_ui]
                        metric_data && increment_accum(accum, 'aggregation_ui', metric_data[this.selected_aggregation_ui])
                        break
                    default:
                }
                return accum
            }, {
                counters: {},
                sums: {}
            })
        },
    },
    template: `
<div>
    <div v-if="window.location.search.indexOf('test') > -1" 
        class="d-flex" style="background-color: #80808080">
            <div class="d-flex flex-grow-1">
                DEBUG || 
                is_loading: [[ is_loading ]] || 
                selected_filters: [[ selected_filters ]] ||
            </div>
    </div>
    
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
                <option value="all">All</option>
                <option value="last_month">Last Month</option>
            </select>
        </div>

        <MultiselectDropdown
            variant="slot"
            :list_items='["Backend Aggregation", "UI Metric", "UI Aggregation"]'
            button_class="btn-icon btn-secondary"
            @change="selected_filters = $event"
        >
            <template #dropdown_button><i class="fa fa-filter"></i></template>
        </MultiselectDropdown>

<!--        <button class="btn btn-basic"-->
<!--            @click="handle_apply_click"-->
<!--            :disabled="is_loading"-->
<!--        >Apply</button>-->
    </div>
    
    <ColorfulCards
        :card_data="colorful_cards_data"
        :selected_aggregation_backend="selected_aggregation_backend"
        :selected_aggregation_ui="selected_aggregation_ui"
        :selected_metric_ui="selected_metric_ui"
    ></ColorfulCards>
    
    <ChartSection
        :tests="filtered_tests"
        :selected_aggregation_backend="selected_aggregation_backend"
        :selected_aggregation_ui="selected_aggregation_ui"
        :selected_metric_ui="selected_metric_ui"
    ></ChartSection>
    
</div>
    `
}

register_component('SummaryFilter', SummaryFilter)



