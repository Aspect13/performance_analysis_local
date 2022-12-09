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
                display: true
            },
            title: {
                display: false
            }
        },
        scales: {
            x: {
                type: 'time',
                // grid: {
                //     display: false
                // },
                ticks: {
                    count: 10
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                text: 'Y label here',
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
            // active_users: {
            //     type: 'linear',
            //     position: 'right',
            //     min: 0,
            //     grid: {
            //         display: false,
            //         drawOnChartArea: false,
            //     },
            //     // ticks: {
            //     //     count: 10
            //     // }
            // }
        }
    },
    // plugins: []
}


// const FilterDropdown = {
//     delimiters: ['[[', ']]'],
//     // props: {
//     //     itemsList: {
//     //         default: () => []
//     //     },
//     // },
//     props: ['items'],
//     data() {
//         return {
//             // refSearchId: 'refSearchCbx'+Math.round(Math.random() * 1000),
//             // refDropdownId: 'refDropdown'+Math.round(Math.random() * 1000),
//             // closeOnItem: true,
//             // clickedItem: {
//             //     title: '',
//             //     isChecked: false,
//             // },
//             // foundedItems: [...this.itemsList],
//             // classTitle: 'complex-list_filled',
//             selected_items: [],
//             search_text: '',
//         }
//     },
//     computed: {
//         isAllSelected() {
//             return (this.selected_items.length < this.items.length) && this.selected_items.length > 0
//         },
//         title_class() {
//             if (this.selected_items.length === 1) {
//                 return 'complex-list_filled'
//             } else if (this.selected_items.length === 0) {
//                 return 'complex-list_empty'
//             } else if (this.selected_items.length > 1) {
//                 return 'complex-list_filled'
//             }
//         },
//         tite_text() {
//             if (this.selected_items.length === 1) {
//                 return this.selected_items[0]
//             } else if (this.selected_items.length === 0) {
//                 return 'Select something'
//             } else if (this.selected_items.length > 1) {
//                 return `${this.selected_items.length} items selected`
//             }
//         },
//         filtered_items() {
//             if (this.search_text === '') {
//                 return this.items
//             }
//             return this.items.filter(i => i.name.startsWith(this.search_text))
//         }
//     },
//     // watch: {
//     //     selectedItems: function () {
//     //         this.$refs[this.refSearchId].checked = this.selectedItems.length === this.foundedItems.length ? true : false;
//     //     }
//     // },
//     // mounted() {
//     //     $(".dropdown-menu.close-outside").on("click", function (event) {
//     //         event.stopPropagation();
//     //     });
//     // },
//     methods: {
//         // handlerSelectAll() {
//         //     if (this.selectedItems.length !== this.foundedItems.length) {
//         //         this.selectedItems = [...this.foundedItems];
//         //         // this.$refs[this.refDropdownId].forEach(el => {
//         //         //     el.checked = true;
//         //         // })
//         //     } else {
//         //         this.selectedItems.splice(0);
//         //         this.$refs[this.refDropdownId].forEach(el => {
//         //             el.checked = false;
//         //         })
//         //     }
//         //     this.$emit('select-items', this.selectedItems);
//         // },
//         // setClickedItem(title, { target: { checked }}) {
//         //     this.selectedItems = checked ?
//         //         [...this.selectedItems, title] :
//         //         this.selectedItems.filter(item => item !== title);
//         //     this.$emit('select-items', this.selectedItems);
//         // },
//
//         // search_item({ target: { value }}) {
//         //     this.selectedItems = [];
//         //     this.$refs[this.refDropdownId].forEach(el => {
//         //         el.checked = false;
//         //     })
//         //     if (value) {
//         //         this.foundedItems = this.itemsList.filter(metric => {
//         //             return metric.toUpperCase().includes(value.toUpperCase())
//         //         })
//         //     } else {
//         //         this.foundedItems  = [...this.itemsList]
//         //     }
//         // }
//     },
//     template: `
//         <div class="complex-list">
//             <button class="btn btn-select dropdown-toggle text-left w-100" type="button"
//                 data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
//                 <span class="d-inline-block"
//                     :class="title_class"
//                 >
//                     [[ tite_text ]]
//                 </span>
//             </button>
//             <div class="dropdown-menu close-outside">
//                 <div class="px-3 pb-2 search-group">
//                     <div class="custom-input custom-input_search__sm position-relative">
//                         <input type="text" placeholder="Search"
//                             v-model="search_text"
//                         />
//                         <img src="/design-system/static/assets/ico/search.svg" class="icon-search position-absolute">
//                     </div>
//                 </div>
//                 <div class="dropdown-item dropdown-menu_item d-flex align-items-center">
//                    <label
//                         class="mb-0 w-100 d-flex align-items-center custom-checkbox"
//                         :class="{ 'custom-checkbox__minus': isAllSelected }">
//                         <input type="checkbox"
//                             @click="handlerSelectAll"
//                         >
//                         <span class="w-100 d-inline-block ml-3">All</span>
//                    </label>
//                 </div>
//                 <ul class="my-0" style="overflow: scroll; height: 183px;">
//                     <li class="dropdown-item dropdown-menu_item d-flex align-items-center"
//                         v-for="item in filtered_items"
//                         :key="item"
//                     >
//                         <label class="mb-0 w-100 d-flex align-items-center custom-checkbox">
//                             <input type="checkbox">
//                             <span class="w-100 d-inline-block ml-3">[[ item ]]</span>
//                         </label>
//                     </li>
//                 </ul>
//             </div>
//         </div>
//     `
// }

// const check_for_dataset = () => {
//     window.charts.builder =
// }

const clear_block_filter = (block_id, update_chart = true) => {
    window.charts.builder.data.datasets = window.charts.builder.data.datasets.filter(ds =>
        ds.source_block_id !== block_id
    )
    update_chart && window.charts.builder.update()
}

const FilterBlock = {
    delimiters: ['[[', ']]'],
    // components: {
    //     'FilterDropdown': FilterDropdown,
    // },
    props: ['idx', 'block_id', 'block_type', 'transaction_options', 'metric_options'],
    emits: ['remove'],
    data() {
        return {
            selected_transactions: [],
            selected_metrics: [],
            is_loading: false,
        }
    },
    methods: {
        get_random_color() {
            return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
        },
        handle_apply_click() {
            this.is_loading = true
            // setTimeout(() => this.is_loading = false, 4000)
            console.log(this.$data)
            // window.charts.builder.data.datasets
            let datasets = []
            window.tmp.forEach(test => {
                Object.entries(test.datasets).forEach(([loop_id, ds]) => {
                    const metrics_datasets = this.selected_metrics.map(i => {
                        const data = ds[i].map((item, index) => {
                            const time_delta = new Date(ds['timestamp'][index]) -
                                new Date(ds['timestamp'][0])
                            return {
                                x: new Date(new Date(window.earliest_date).valueOf() + time_delta),
                                y: item
                            }
                        }) // todo: splice data from selected pages
                        // console.log('data', data)
                        const dataset = {
                            label: `Loop[${loop_id}]: ${i}`,
                            data: data,
                            // fill: false,
                            borderColor: this.get_random_color(),
                            // tension: 0.1,
                            type: 'scatter',
                            // hidden: true,
                            source_block_id: this.block_id
                        }
                        console.log('dataset', dataset)
                        return dataset
                    })
                    datasets = [...datasets, ...metrics_datasets]
                })
            })
            clear_block_filter(this.block_id,false)
            window.charts.builder.data.datasets = [...window.charts.builder.data.datasets, ...datasets]

            window.charts.builder.update()
            this.is_loading = false
        },

        handle_remove() {
            clear_block_filter(this.block_id)
            this.$emit('remove', this.idx)
        }
    },
    template: `
    <div class="d-flex flex-grow-1 p-3 align-items-center">
        <div class="d-flex flex-column flex-grow-1">
            <p class="font-h5 font-bold mb-1 text-gray-800">
                [[ block_type === 'backend' ? 'Transactions/Requests' : 'Pages/Actions' ]]
            </p>
            <MultiselectDropdown
                :list_items="transaction_options"
                v-model="selected_transactions"
                placeholder="Select items"
                button_class="btn btn-select dropdown-toggle d-inline-flex align-items-center"
            ></MultiselectDropdown>
            <p class="font-h5 font-bold my-1 text-gray-800">Metrics</p>
            <MultiselectDropdown
                :list_items="metric_options"
                v-model="selected_metrics"
                placeholder="Select metrics"
                button_class="btn btn-select dropdown-toggle d-inline-flex align-items-center"
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

// const BACKEND_OPTIONS = ['bk1', 'bk2', 'bk3']
// const UI_OPTIONS = ['ui_1', 'ui_2', 'ui1']
const JOIN_CHAR = ' | '

const BuilderFilter = {
    components: {
        'FilterBlock': FilterBlock,
    },
    props: ['unique_groups', 'ui_performance_builder_data', 'tests'],
    data() {
        return {
            blocks: [],
            metrics: {
                ui: {
                    load_time: 'load_time',
                    dom: 'dom',
                    tti: 'tti',
                    fcp: 'fcp',
                    lcp: 'lcp',
                    cls: 'cls',
                    tbt: 'tbt',
                    fvc: 'fvc',
                    lvc: 'lvc',
                },
                backend: {
                    dummy1: 'Dummy1',
                    dummy2: 'Dummy2'
                }
            },
            backend_options: [],
            ui_options: [],
            is_loading: false,
            all_tests_backend_requests: ['dummy1', 'dummy2'],
            all_tests_ui_pages: [],
        }
    },
    async mounted() {

        // const {datasets, page_names, earliest_date} = await this.fetch_ui_data()
        const {page_names, earliest_date} = this.ui_performance_builder_data
        this.all_tests_ui_pages = page_names
        this.set_options()

        window.tmp = this.tests  // todo: remove
        window.earliest_date = earliest_date
        // chart_options.data = {
        //     labels: Array.from(Array(max_x_axis_labels)).map((_, i) => `step ${i}`)
        // }
        window.charts.builder = new Chart('builder_chart', chart_options)
    },
    methods: {
        handle_remove(idx) {
            this.blocks.splice(idx, 1)
        },
        make_id() {
            return new Date().valueOf()
        },
        handle_clear_all() {
            this.blocks.forEach(({id}) => clear_block_filter(id, false))
            this.blocks = []
            window.charts.builder.update()
        },
        // async fetch_ui_data() {
        //     this.is_loading = true
        //     let result
        //     try {
        //         const response = await fetch('/api/v1/ui_performance/analytics/1', {
        //             method: 'POST',
        //             headers: {'Content-Type': 'application/json'},
        //             body: JSON.stringify({
        //                 ids: [8]
        //             })
        //         })
        //         result = await response.json()
        //
        //     } catch (e) {
        //         console.error('Error', e)
        //         result = {}
        //     } finally {
        //         this.is_loading = false
        //     }
        //     return result
        // },
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
                        @click="blocks.push({id: make_id(), type: backend_options.length === 0 ? 'ui' : 'backend'})"
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
                            <li class="dropdown-item" @click="blocks.push({id: make_id(), type: 'backend'})">
                                <span class="pl-2">Backend</span>
                            </li>
                            <li class="dropdown-item" @click="blocks.push({id: make_id(), type: 'ui'})">
                                <span class="pl-2">UI</span>
                            </li>
                        </ul>
                    </div>
                </p>
            </div>
            <hr class="my-0">
            <div class="builder_filter_blocks">
                <div v-for="({id, type}, index) in blocks" :key="id">
                    <hr class="my-0" v-if="index > 0">
                    <FilterBlock
                       :idx="index"
                       :block_id="id"
                       :block_type="type"
                       :transaction_options="type === 'backend' ? backend_options : ui_options"
                       :metric_options="Object.values(metrics[type]) || []"
                       @remove="handle_remove"
                    >
                    </FilterBlock>
                </div> 
            </div>
        </div>
    `
}
register_component('BuilderFilter', BuilderFilter)

$(document).on('vue_init', () => V.custom_data.time_aggregation = 'auto')