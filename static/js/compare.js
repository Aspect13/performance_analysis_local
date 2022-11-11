var summary_formatters = {
    total(value, row, index) {
        if (row.group === 'backend_performance') {
            return value
        }
    },
}
var baseline_formatters = {
    total(value, row, index) {
        if (row.group === 'backend_performance') {
            return value -
        }
    },
}
