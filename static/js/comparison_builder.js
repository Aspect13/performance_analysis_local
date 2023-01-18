const chart_options = {
    type: 'line',
    options: {
        // animation: false,
        responsive: true,
        // hoverMode: 'index',
        // interaction: {
        //     mode: 'point'
        // },
        plugins: {
            legend: {
                display: true,
                onHover: (event, legendItem, legend) => {
                    // console.log(event, legendItem, legend)
                    legend.chart.data.datasets[legendItem.datasetIndex].radius = 12
                    legend.chart.update()
                },
                onLeave: (event, legendItem, legend) => {
                    // console.log(event, legendItem, legend)
                    legend.chart.data.datasets[legendItem.datasetIndex].radius = 6
                    legend.chart.update()
                },
                labels: {
                    usePointStyle: true
                },
            },
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    // afterTitle: (tooltip_item) => {
                    //     console.log('tti', tooltip_item)
                    //     return 'qwerty\nasdf\t123'
                    // },
                    beforeLabel: ({raw}) => {
                        let result = `test: ${raw.tooltip.test_name}; env: ${raw.tooltip.test_env}`
                        if (raw.tooltip.loop) {
                            result += `\nloop: ${raw.tooltip.loop}`
                        }
                        return result
                    },
                    afterLabel: ({raw}) => {
                        if (raw.tooltip.page) {
                            return `page: ${raw.tooltip.page}`
                        }
                        if (raw.tooltip.request) {
                            return `request: ${raw.tooltip.request}`
                        }
                    },
                    label: ({raw, formattedValue}) => `${raw.tooltip.metric}: ${formattedValue}`
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                // time: {
                //     // unit: 'day',
                //     displayFormats: {
                //         // day: 'dd MM'
                //         day: 'P'
                //     },
                //     minUnit: 'hour'
                // },
                // grid: {
                //     display: false
                // },
                ticks: {
                    count: 10,
                    max: 10
                },
                display: false
            },
            y: {
                type: 'linear',
                position: 'left',
                // text: 'Y label here',
                display: true,
                grid: {
                    display: true,
                    borderDash: [2, 1],
                    color: "#D3D3D3"
                },
                // ticks: {
                //     count: 10
                // }
            },
        }
    },
}

// constants and public functions
const JOIN_CHAR = ' | '
const get_random_color = () => {
    const rnd = () => Math.floor(Math.random() * 255)
    return `rgb(${rnd()}, ${rnd()}, ${rnd()})`
}
const builder_metrics = {
    [page_constants.ui_name]: {
        load_time: {name: 'Load Time', color: '#ff0000'},
        dom: {name: 'DOM', color: '#00ff00'},
        tti: {name: 'tti', color: '#0000ff'},
        fcp: {name: 'fcp', color: get_random_color()},
        lcp: {name: 'lcp', color: get_random_color()},
        cls: {name: 'cls', color: get_random_color()},
        tbt: {name: 'tbt', color: get_random_color()},
        fvc: {name: 'fvc', color: get_random_color()},
        lvc: {name: 'lvc', color: get_random_color()},
    },
    [page_constants.backend_name]: {
        total: {name: 'total', color: get_random_color()},
        min: {name: 'min', color: get_random_color()},
        max: {name: 'max', color: get_random_color()},
        median: {name: 'median', color: get_random_color()},
        pct90: {name: 'pct90', color: get_random_color()},
        pct95: {name: 'pct95', color: get_random_color()},
        pct99: {name: 'pct99', color: get_random_color()},
        onexx: {name: 'onexx', color: get_random_color()},
        twoxx: {name: 'twoxx', color: get_random_color()},
        threexx: {name: 'threexx', color: get_random_color()},
        fourxx: {name: 'fourxx', color: get_random_color()},
        fivexx: {name: 'fivexx', color: get_random_color()}
    }
}
const clear_block_filter = (block_id, update_chart = true) => {
    // clear from chart
    window.chart_builder.data.datasets = window.chart_builder.data.datasets.filter(ds =>
        ds.source_block_id !== block_id
    )
    update_chart && window.chart_builder.update()
}

const parse_action = action => {
    if (action.includes(JOIN_CHAR)) {
        const [test_name, test_env, action_name] = action.split(JOIN_CHAR)
        return [test_name, test_env, action_name]
    } else {
        return [null, null, action]
    }
}

const get_pages_to_display = (test, selected_actions) => selected_actions.reduce((accum, option) => {
    const [test_name, test_env, action_name] = parse_action(option)
    if (test_name !== null && test_env !== null) {
        if (test_name === test.name && test_env === test.test_env) {
            accum.push(action_name)
        }
    } else {
        accum.push(action_name)
    }
    return accum
}, [])

const clear_filter_blocks_from_table = block_ids => {
    V.registered_components.table_comparison.table_action('remove',
        {field: 'source_block_id', values: block_ids}
    )
}

var comparison_formatters = {
    source_block_id(value, row) {
        // ('#1671449291816')[0].scrollIntoView({behavior: "smooth", block: "start"})
        return `<a class="fa fa-file-arrow-up" href="#${value}"></a>`
    }
}

// components
const FilterBlock = {
    delimiters: ['[[', ']]'],
    props: ['idx', 'block_id', 'block_type', 'action_options', 'metric_options', 'is_loading'],
    emits: ['remove', 'apply'],
    data() {
        return {
            selected_transactions: [],
            selected_metrics: [],
            // is_loading: false,
        }
    },
    methods: {
        handle_apply_click() {
            this.$emit('apply', this.idx, this.selected_transactions, this.selected_metrics)
        },

        handle_remove() {
            this.$emit('remove', this.idx)
        }
    },
    computed: {
        colored_metric_options() {
            return Object.entries(this.metric_options).map(([k, {name, color}]) => {
                console.log(k, name, color)

                return {
                    name,
                    data_key: k,
                    // html: `<span style="color: ${color || '#000'}" class="w-100 d-inline-block ml-3">${name}</span>`,
                    html: `<span class="w-100 d-inline-block ml-3">${name}<span class="ml-1 circle" style="border-color: ${color}" ></span></span>`,
                }
            })
        },
        multiselect_title() {
            return this.block_type === page_constants.backend_name ? 'Transactions/Requests' : 'Pages/Actions'
        }
    },
    template: `
    <div class="d-flex flex-grow-1 p-3 align-items-center" :id="block_id">
        <div class="d-flex flex-column flex-grow-1">
            <p class="font-h5 font-bold mb-1 text-gray-800">
                [[ multiselect_title ]]
            </p>
            <MultiselectDropdown
                :list_items="action_options"
                v-model="selected_transactions"
                placeholder="Select items"
            ></MultiselectDropdown>
            <p class="font-h5 font-bold my-1 text-gray-800">Metrics</p>
            <MultiselectDropdown
                :list_items="colored_metric_options"
                v-model="selected_metrics"
                placeholder="Select metrics"
                return_key="data_key"
            ></MultiselectDropdown>
            <div class="pt-3">
                <button class="btn btn-secondary"
                    style="position: relative; padding-right: 24px"
                    :disabled="is_loading || (selected_transactions.length === 0 || selected_metrics.length === 0)"
                    @click="handle_apply_click"
                >
                    Apply
                    <i class="spinner-loader" style="position: absolute; top: 8px; right: 5px"
                        v-show="is_loading"
                    ></i>
                </button>
            </div>
            
        </div>
        <i class="icon__16x16 icon-minus__16 ml-4 mb-3" 
            @click="handle_remove"
        ></i>
    </div>
    `
}

const BuilderFilter = {
    delimiters: ['[[', ']]'],
    components: {
        'FilterBlock': FilterBlock,
    },
    props: ['unique_groups', 'ui_performance_builder_data', 'backend_performance_builder_data', 'tests', 'backend_time_aggregation'],
    data() {
        return {
            blocks: [],
            backend_options: [],
            ui_options: [],
            is_loading: false,
            all_tests_backend_requests: [],
            all_tests_ui_pages: [],
            earliest_date: new Date()
        }
    },
    async mounted() {
        // const {datasets, page_names, earliest_date} = await this.fetch_ui_data()
        const {page_names, earliest_date: ui_earliest_date} = this.ui_performance_builder_data
        this.all_tests_ui_pages = page_names
        const {all_requests, earliest_date: backend_earliest_date} = this.backend_performance_builder_data
        this.all_tests_backend_requests = all_requests
        this.set_options()

        if (ui_earliest_date === undefined && backend_earliest_date === undefined) {
            console.error('Earliest date cannot be set')
        } else if (ui_earliest_date === undefined) {
            this.earliest_date = new Date(backend_earliest_date)
        } else if (backend_earliest_date === undefined) {
            this.earliest_date = new Date(ui_earliest_date)
        } else {
            this.earliest_date = new Date(ui_earliest_date) < new Date(backend_earliest_date) ?
                new Date(ui_earliest_date) : new Date(backend_earliest_date)
        }

        window.chart_builder = new Chart('builder_chart', chart_options)
        $('html').css({'scroll-behavior': 'smooth'}) // todo: maybe we don't need that
    },
    methods: {
        handle_remove(idx) {
            const {id: block_id} = this.blocks.splice(idx, 1)[0]
            clear_block_filter(block_id)
            clear_filter_blocks_from_table([block_id])
        },
        make_id() {
            return new Date().valueOf()
        },
        handle_clear_all() {
            window.chart_builder.data.datasets = []
            window.chart_builder.update()
            this.$root.registered_components.table_comparison.table_action('removeAll')
            this.blocks = []
        },
        set_options() {
            Object.entries(this.unique_groups).forEach(([group, i]) => {
                switch (group) {
                    case 'backend_performance':
                        if (i.length === 1) {
                            this.backend_options = this.all_tests_backend_requests
                        } else {
                            this.backend_options = this.all_tests_backend_requests.reduce((accum, o) => {
                                return [...accum, ...i.map(combo => [...combo, o].join(JOIN_CHAR))]
                            }, [])
                        }
                        break
                    case 'ui_performance':
                        if (i.length === 1) {
                            this.ui_options = this.all_tests_ui_pages
                        } else {
                            this.ui_options = this.all_tests_ui_pages.reduce((accum, o) => {
                                return [...accum, ...i.map(combo => [...combo, o].join(JOIN_CHAR))]
                            }, [])
                        }
                        break
                    default:
                        console.warn('Unknown test group: ', group)
                }
            })
        },
        make_backend_data(request, block_data, tests, selected_metrics) {
            let datasets = []
            let table_data = []
            selected_metrics.forEach(metric => {
                let tests_data = []
                tests.forEach(test => {
                    if (
                        test.datasets[this.backend_time_aggregation] !== undefined &&
                        test.datasets[this.backend_time_aggregation][request] !== undefined
                    ) {
                        tests_data = [
                            ...tests_data,
                            ...test.datasets[this.backend_time_aggregation][request].map(scoped_dataset => {
                                const time_delta = new Date(scoped_dataset.time) - new Date(test.start_time)
                                const {name, color} = builder_metrics[block_data.type][metric]
                                return {
                                    x: new Date(this.earliest_date.valueOf() + time_delta),
                                    y: scoped_dataset[metric],
                                    tooltip: {
                                        test_name: test.name,
                                        test_env: test.test_env,
                                        test_id: test.id,
                                        metric: name,
                                        request: request,
                                        real_start_time: scoped_dataset.time
                                    },
                                    border_color: color
                                }
                            })
                        ]
                    }
                })
                const dataset = {
                    label: `${request}: ${metric}`,
                    // data: tests_data.sort((a, b) => {
                    //     return a.x - b.x
                    // }),
                    data: tests_data,
                    // fill: true,
                    borderColor: tests_data.map(i => i.border_color || '#ffffff'),
                    borderWidth: 2,
                    backgroundColor: get_random_color(),
                    tension: 0.4,
                    type: 'line',
                    showLine: true,
                    radius: 3,
                    // hidden: true,
                    source_block_id: block_data.id
                }
                console.log('dataset', dataset)
                datasets.push(dataset)
                table_data = [...table_data, ...dataset.data.map(dsi => ({
                    test_id: dsi.tooltip.test_id,
                    name: dsi.tooltip.test_name,
                    start_time: dsi.tooltip.real_start_time,
                    page: dsi.tooltip.request,
                    metric: dsi.tooltip.metric,
                    source_block_id: block_data.id,
                    value: dsi.y
                }))]
            })
            return [datasets, table_data]
        },
        make_ui_data(test, block_data, selected_actions, selected_metrics) {
            let datasets = []
            let table_data = []
            const pages = get_pages_to_display(test, selected_actions)
            pages.forEach(page => {
                Object.entries(test.datasets[page]).forEach(([loop_id, ds]) => {
                    const metrics_data = selected_metrics.map(metric_data_key => {
                        // const metric_data_key = builder_metrics[block_data.type][i]
                        const time_delta = new Date(ds.timestamp) - new Date(test.start_time)
                        const {name, color} = builder_metrics[block_data.type][metric_data_key]
                        return {
                            x: new Date(this.earliest_date.valueOf() + time_delta),
                            y: ds[metric_data_key],
                            tooltip: {
                                test_name: test.name,
                                test_env: test.test_env,
                                test_id: test.id,
                                loop: loop_id,
                                metric: name,
                                page: page,
                                real_start_time: ds.timestamp
                            },
                            border_color: color
                        }

                    })
                    const dataset = {
                        label: `${test.name}(id:${test.id}) - ${page}`,
                        data: metrics_data,
                        fill: true,
                        borderColor: metrics_data.map(i => i.border_color || '#ffffff'),
                        borderWidth: 2,
                        backgroundColor: get_random_color(),
                        // tension: 0.1,
                        type: 'scatter',
                        radius: 6,
                        // hidden: true,
                        source_block_id: block_data.id,
                        showLine: false
                    }
                    console.log('dataset', dataset)
                    datasets.push(dataset)
                    table_data = [...table_data, ...dataset.data.map(dsi => ({
                        test_id: test.id,
                        name: test.name,
                        start_time: dsi.tooltip.real_start_time,
                        page: page,
                        metric: dsi.tooltip.metric,
                        source_block_id: block_data.id,
                        value: dsi.y
                    }))]
                })
            })
            return [datasets, table_data]
        },
        handle_apply(block_index, selected_actions, selected_metrics) {
            const block_data = this.blocks[block_index]
            let all_datasets = []
            let all_table_data = []

            switch (block_data.type) {
                case page_constants.backend_name:
                    selected_actions.forEach(request => {
                        const [test_name, test_env, action_name] = parse_action(request)
                        let filtered_backend_tests = this.tests.filter(({group}) => group === block_data.type)
                        if (test_name !== null && test_env !== null) {
                            filtered_backend_tests = filtered_backend_tests.filter(test =>
                                test.name === test_name &&
                                test.test_env === test_env
                            )
                        }
                        const [datasets, table_data] = this.make_backend_data(
                            action_name,
                            block_data,
                            filtered_backend_tests,
                            selected_metrics
                        )
                        all_datasets = [...all_datasets, ...datasets]
                        all_table_data = [...all_table_data, ...table_data]
                    })
                    break
                case page_constants.ui_name:
                    this.tests.filter(({group}) => group === block_data.type).forEach(test => {
                        const [datasets, table_data] = this.make_ui_data(
                            test, block_data, selected_actions, selected_metrics
                        )
                        all_datasets = [...all_datasets, ...datasets]
                        all_table_data = [...all_table_data, ...table_data]
                    })
                    break
                default:
                    throw 'UNKNOWN DATA TYPE'
            }

            clear_block_filter(block_data.id, false)
            window.chart_builder.data.datasets = [...window.chart_builder.data.datasets, ...all_datasets]
            window.chart_builder.update()

            clear_filter_blocks_from_table([block_data.id])
            this.$root.registered_components.table_comparison.table_action('append', all_table_data)
        },
        handle_add_filter_block(block_type = undefined) {
            if (block_type === undefined) {
                block_type = this.backend_options.length === 0 ? page_constants.ui_name : page_constants.backend_name
            }
            this.blocks.push({
                id: this.make_id(),
                type: block_type,
                is_loading: false
            })
        },
        get_action_options(type) {
            return type === page_constants.backend_name ? this.backend_options : this.ui_options
            // return builder_metrics[type] || {}
        },
        get_metric_options(type) {
            return builder_metrics[type] || {}
        }
    },
    template: `
        <div class="builder_filter_container card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <p class="font-h5 font-bold py-3 px-4 text-gray-800">DATA FILTER</p>
                <p class="font-h5 font-bold py-3 px-4 text-gray-800" v-if="is_loading">LOADING</p>
                <p class="text-purple font-semibold font-h5 cursor-pointer d-flex align-items-center">
                    <span @click="handle_clear_all">Clear all</span>
                    <button class="btn"
                        v-if="backend_options.length === 0 || ui_options.length === 0"
                        @click="handle_add_filter_block()"
                    >
                        <i class="fa fa-plus text-purple"></i>
                    </button>
                    <div class="dropdown dropleft dropdown_action mr-2"
                        v-else
                    >
                        <button class="btn dropdown-toggle"
                                role="button"
                                data-toggle="dropdown"
                                aria-expanded="false">
                            <i class="fa fa-plus text-purple"></i>
                        </button>

                        <ul class="dropdown-menu">
                            <li class="px-3 py-1 font-weight-500">Add Filter</li>
                            <li class="dropdown-item" @click="handle_add_filter_block('${page_constants.backend_name}')">
                                <span class="pl-2">Backend</span>
                            </li>
                            <li class="dropdown-item" @click="handle_add_filter_block('${page_constants.ui_name}')">
                                <span class="pl-2">UI</span>
                            </li>
                        </ul>
                    </div>
                </p>
            </div>
            <hr class="my-0">
            <div class="builder_filter_blocks">
                <div v-for="({id, type, is_loading}, index) in blocks" :key="id">
                    <hr class="my-0" v-if="index > 0">
                    <FilterBlock
                       :idx="index"
                       :block_id="id"
                       :block_type="type"
                       :is_loading="is_loading"
                       :action_options="get_action_options(type)"
                       :metric_options="get_metric_options(type)"
                       @remove="handle_remove"
                       @apply="handle_apply"
                    >
                    </FilterBlock>
                </div> 
            </div>
        </div>
    `
}
register_component('BuilderFilter', BuilderFilter)

$(document).on('vue_init', () => V.custom_data.time_aggregation = '1s')