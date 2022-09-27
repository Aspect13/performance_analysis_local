const api_base = '/api/v1'

const ColorfulCards = {
    template: `
    <div class="d-flex mt-3 colorful-cards">
        <div class="col">
            <div class="card card-sm card-blue">
                <div class="card-header">'value' req/sec</div>
                <div class="card-body">AVR. THROUGHPUT</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-red">
                <div class="card-header">'value'%</div>
                <div class="card-body">ERROR RATE</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-azure">
                <div class="card-header">'value' ms</div>
                <div class="card-body">95 PCT. RESP. TIME</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-magento">
                <div class="card-header">'value' ms</div>
                <div class="card-body">AVR. RESPONSE TIME</div>
            </div>
        </div>
        <div class="col">
            <div class="card card-sm card-orange">
                <div class="card-header">'value' ms</div>
                <div class="card-body">PAGE LOAD TIME</div>
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
            selected_aggregation_backend: 'min',
            selected_aggregation_ui: 'min',
            start_time: 'last_month',
            end_time: undefined,
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
        selected_groups(newValue) {
            this.tests = Array.from(this.all_data.reduce((accum, item) => {
                (newValue.includes('all') || newValue.includes(item.group)) &&
                    accum.add(`${item.group.slice(0, 2)}::${item.name}`)
                return accum
            }, new Set()))

            // this.$nextTick(this.refresh_pickers)
        },
        tests(newValue) {
            // change selected test dropdown
            this.selected_tests = newValue.length > 0 ? ['all'] : []
            this.$nextTick(this.refresh_pickers)
        },
        selected_tests(newValue) {
            const selected_tests_names = newValue.map(i => i === 'all' ? 'all' : i.split('::')[1])
            const test_types = new Set()
            const test_envs = new Set()
            this.all_data.map(item => {
                if (
                    (this.selected_groups.includes(item.group) || this.selected_groups.includes('all'))
                    &&
                    (selected_tests_names.includes(item.name) || selected_tests_names.includes('all'))
                ) {
                    test_types.add(item.test_type)
                    test_envs.add(item.test_env)
                }
            })
            this.test_types = Array.from(test_types)
            this.test_envs = Array.from(test_envs)
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
        async start_time(newValue) {
            await this.fetch_data()
        }
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
        }
    },
    computed: {
        backend_test_selected() {
            return this.selected_groups.includes('all') || this.selected_groups.includes('backend_performance')
            // todo: backend_performance may not be the name for backend tests
        },
        ui_test_selected() {
            return this.selected_groups.includes('all') || this.selected_groups.includes('ui_performance')
            // todo: ui_performance may not be the name for ui tests
        },
        filtered_tests() {
            return this.all_data.filter(i => {
                return (this.selected_groups.includes('all') || this.selected_groups.includes(i.group))
                &&
                (this.selected_tests.includes('all') || this.selected_tests.includes(i.name))
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
        avg_throughput() {
            return this.filtered_tests.reduce(
                (prev, next) => prev.throughput || 0 + next.throughput || 0, 0
            ) / this.filtered_tests.length
        },

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

        <button class="btn btn-basic">Apply</button>
    </div>
    <ColorfulCards></ColorfulCards>
</div>
    `
}

register_component('SummaryFilter', SummaryFilter)