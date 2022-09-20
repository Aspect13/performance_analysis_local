const api_base = '/api/v1'
const SummaryFilter = {
    delimiters: ['[[', ']]'],
    data() {
        return {
            groups: [],
            selected_group: undefined,
            tests: [],
            selected_test: undefined,
        }
    },
    async mounted() {
        const resp = await fetch(api_base + '/performance_analysis/group/' + getSelectedProjectId())
        if (resp.ok) {
            this.groups = await resp.json()
            this.selected_group = this.groups.length > 0 ? 'all' : undefined
            this.$nextTick(this.refresh_pickers)
        } else {
            showNotify('ERROR', 'Error fetching groups')
        }
    },
    watch: {
        // groups(newValue) {
        //     this.$nextTick(this.refresh_pickers)
        // },
        async selected_group(newValue) {
            const resp = await fetch(
                api_base + '/performance_analysis/test/' +
                getSelectedProjectId() + '/' + newValue
            )
            if (resp.ok) {
                this.tests = await resp.json()
                this.selected_test = this.tests.length > 0 ? 'all' : undefined
                this.$nextTick(this.refresh_pickers)
            } else {
                showNotify('ERROR', 'Error fetching tests')
            }
        },
        // tests(newValue) {
        //     this.$nextTick(this.refresh_pickers)
        // }
    },
    methods: {
        refresh_pickers() {
            $(this.$el).find('.selectpicker').selectpicker('redner').selectpicker('refresh')
        }
    },
    template: `
    <div class="d-flex">
        <div class="d-flex justify-content-between flex-grow-1">
            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">group</span>
                <select class="selectpicker flex-grow-1" data-style="item__right"
                    v-model="selected_group"
                >
                    <option value="all" 
                        v-if="groups.length > 0"
                    >All</option>
                    <option v-for="i in groups" :value="i" :key="i">[[ i ]]</option>
                </select>
            </div>

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">test</span>
                <select class="selectpicker flex-grow-1" data-style="item__right"
                    :disabled="tests.length === 0"
                    v-model="selected_test"
                >
                    <option value="all"
                        v-if="tests.length > 0"
                    >All</option>
                    <option v-for="i in tests" :value="i" :key="i">[[ i ]]</option>
                </select>
            </div>

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">type</span>
                <select class="selectpicker flex-grow-1" data-style="item__right">
                    <option value="all">All</option>
                </select>
            </div>

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">env.</span>
                <select class="selectpicker flex-grow-1" data-style="item__right">
                    <option value="all">All</option>
                </select>
            </div>

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left text-uppercase">aggr.</span>
                <select class="selectpicker flex-grow-1" data-style="item__right">
                    <option value="95">95 pct</option>
                </select>
            </div>

            <div class="selectpicker-titled w-100">
                <span class="font-h6 font-semibold px-3 item__left fa fa-calendar"></span>
                <select class="selectpicker flex-grow-1" data-style="item__right">
                    <option value="last_month">Last Month</option>
                </select>
            </div>
        </div>

        <div class="mx-3">
            <button class="btn btn-secondary btn-icon"><i class="fa fa-filter"></i></button>
        </div>

        <button class="btn btn-basic">Apply</button>
    </div>
    `
}

register_component('SummaryFilter', SummaryFilter)