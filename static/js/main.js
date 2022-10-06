var report_formatters = {
    name(value) {
        return value
    },
    start(value, row, index) {
        return new Date(value).toLocaleString()
    },
    status(value, row, index) {
        switch (value.toLowerCase()) {
            case 'error':
                return `<div style="color: var(--red)"><i class="fas fa-exclamation-circle error"></i> ${value}</div>`
            case 'failed':
                return `<div style="color: var(--red)"><i class="fas fa-exclamation-circle error"></i> ${value}</div>`
            case 'success':
                return `<div style="color: var(--green)"><i class="fas fa-exclamation-circle error"></i> ${value}</div>`
            case 'canceled':
                return `<div style="color: var(--gray)"><i class="fas fa-times-circle"></i> ${value}</div>`
            case 'finished':
                return `<div style="color: var(--info)"><i class="fas fa-check-circle"></i> ${value}</div>`
            case 'in progress':
                return `<div style="color: var(--basic)"><i class="fas fa-spinner fa-spin fa-secondary"></i> ${value}</div>`
            case 'post processing':
                return `<div style="color: var(--basic)"><i class="fas fa-spinner fa-spin fa-secondary"></i> ${value}</div>`
            case 'pending...':
                return `<div style="color: var(--basic)"><i class="fas fa-spinner fa-spin fa-secondary"></i> ${value}</div>`
            case 'preparing...':
                return `<div style="color: var(--basic)"><i class="fas fa-spinner fa-spin fa-secondary"></i> ${value}</div>`
            default:
                return value.toLowerCase()
        }
    },
}

const get_common_chart_options = () => ({
    type: 'line',
    // responsive: true,
    options: {
        // maintainAspectRatio: false,
        // aspectRatio: 2,
        interaction: {
            mode: 'index',
            intersect: false
        },
        scales: {
            y: {
                type: 'linear',
                title: {
                    display: true,
                },
                grid: {
                    display: false
                },
            },
            x: {
                // type: 'time',
                grid: {
                    display: false
                },
                ticks: {
                    display: true,
                    // count: 5,
                    maxTicksLimit: 6,
                    callback: function(value, index, ticks) {
                        return new Date(this.getLabelForValue(value)).toLocaleDateString()
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                align: 'start',
                fullSize: false
            },
        },
    },
})
window.charts = {}

$(() => {
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
    window.charts.response_time = new Chart('response_time_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.y.title.text = 'ms'
    chart_options.options.plugins.title.text = 'PAGE SPEED'
    window.charts.page_speed = new Chart('page_speed_chart', chart_options)
})