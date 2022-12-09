var summary_formatters = {
    total(value, row, index) {
        if (row.group === 'backend_performance') {
            return value
        }
    },
}
var baseline_formatters = {
    set_row_baseline: row => {
        try {
            if (row.baseline === undefined) {
                row.baseline = window.baselines[row.group][row.name][row.test_env]
                console.log('Baseline set for', row.id, row.name, row.baseline)
            } else {
                console.debug('Baseline already exists', row.name)
            }
        } catch {
            console.log('No Baseline found', row.name)
        }
    },
    cell_value: value => {
        if (value > 0) {
            return `<span style="color: green">+${value.toFixed(1)}</span>`
        } else if (value < 0) {
            return `<span style="color: red">${value.toFixed(1)}</span>`
        }
        return 0
    },
    _row_formatter: (value, row, index, field) => {
        if (value === undefined) {
            return
        }
        baseline_formatters.set_row_baseline(row)
        if (row.baseline === undefined) {
            return
        }
        try {
            const bsl_value = field.split('.').reduce((acc, key) => acc[key], row.baseline)
            console.log('V', value, 'BSL', bsl_value)
            return baseline_formatters.cell_value(value - bsl_value)
        } catch {
            return
        }
        // switch (row.group) {
        //     case 'backend_performance':
        //         try {
        //             const bsl_value = field.split('.').reduce((acc, key) => acc[key], row.baseline)
        //             console.log('V', value, 'BSL', bsl_value)
        //             return baseline_formatters.cell_value(value - bsl_value)
        //         } catch {
        //             return
        //         }
        //         break
        //     case 'ui_performance':
        //         // console.log('UI', row, field, value)
        //         try {
        //             const bsl_value = field.split('.').reduce((acc, key) => acc[key], row.baseline)
        //             console.log('V', value, 'BSL', bsl_value)
        //             return baseline_formatters.cell_value(value - bsl_value)
        //         } catch {
        //             return
        //         }
        //         break
        //     default:
        //         return
        // }

    },
    total(value, row, index, field) {
        return baseline_formatters._row_formatter(value, row, index, field)
    },
    throughput(value, row, index, field) {
        return baseline_formatters._row_formatter(value, row, index, field)
    },
    failures(value, row, index, field) {
        return baseline_formatters._row_formatter(value, row, index, field)
    },
    aggregations(value, row, index, field) {
        return baseline_formatters._row_formatter(value, row, index, field)
    },
    page_speed(value, row, index, field) {
        return baseline_formatters._row_formatter(value, row, index, field)
    },
}

$(document).on('vue_init', () => {
    window.baselines = JSON.parse(V.registered_components.table_summary.table_attributes.baselines)
})
