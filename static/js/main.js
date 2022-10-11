const api_base = '/api/v1'

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

const quantile = (arr, percent) => {
    const q = percent > 1 ? percent / 100 : percent
    const asc = arr => arr.sort((a, b) => a - b)
    const sorted = asc(arr)
    const pos = (sorted.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base])
    } else {
        return sorted[base]
    }
}

const group_data = (tests, number_of_groups) => {
    let residual = tests.length % number_of_groups
    const group_size = ~~(tests.length / number_of_groups)
    let groups = []
    const pointers = [0, 0]
    while (pointers[1] < tests.length) {
        pointers[1] = pointers[1] + group_size
        if (residual > 0) {
            pointers[1]++ // add extra test to each group if residual > 0
            residual--
        }
        const data_slice = tests.slice(...pointers)
        const struct = {
            error_rate: [],
            throughput: [],
            aggregations: {},
        }
        data_slice.forEach(i => {
            struct.error_rate.push(i.error_rate)
            struct.throughput.push(i.throughput)
            Object.entries(i.aggregations).forEach(([k, v]) => {
                if (struct.aggregations[k]) {
                    struct.aggregations[k].push(v)
                } else {
                    struct.aggregations[k] = [v]
                }
            })

        })
        groups.push({
            name: data_slice.length > 1 ?
                `group ${pointers[0] + 1}-${pointers[1]}` :
                data_slice[0].name,
            aggregated_tests: pointers[1] - pointers[0],
            start_time: data_slice[data_slice.length - 1].start_time, // take start time from last entry of slice
            ...struct
        })
        pointers[0] = pointers[1]
    }
    return groups
}

const aggregation_callback_map = {
    min: arr => arr && Math.min(...arr),
    max: arr => arr && Math.max(...arr),
    mean: arr => arr && arr.reduce((a, i) => a + i, 0) / arr.length,
    pct50: arr => arr && quantile(arr, 50),
    pct75: arr => arr && quantile(arr, 75),
    pct90: arr => arr && quantile(arr, 90),
    pct95: arr => arr && quantile(arr, 95),
    pct99: arr => arr && quantile(arr, 99),
}

const aggregate_data = (grouped_data, group_aggregations_key, data_aggregation_type) => {
    const aggregation_callback = aggregation_callback_map[data_aggregation_type] || aggregation_callback_map.mean
    const struct = {
        labels: [],
        aggregated_tests: [],
        names: [],
        throughput: {
            min: [],
            max: [],
            main: []
        },
        error_rate: {
            min: [],
            max: [],
            main: []
        },
        aggregation: {
            min: [],
            max: [],
            main: []
        }
    }
    grouped_data.forEach(group => {
        // O(n)
        const aggregation_data = group.aggregations[group_aggregations_key]
        !aggregation_data && console.warn(
            'No aggregation "', group_aggregations_key, '" data for ', group
        )
        struct.labels.push(group.start_time)
        struct.aggregated_tests.push(group.aggregated_tests)
        struct.names.push(group.name)
        struct.throughput.min.push(aggregation_callback_map.min(group.throughput))
        struct.throughput.max.push(aggregation_callback_map.max(group.throughput))
        struct.error_rate.min.push(aggregation_callback_map.min(group.error_rate))
        struct.error_rate.max.push(aggregation_callback_map.max(group.error_rate))
        struct.aggregation.min.push(aggregation_callback_map.min(aggregation_data))
        struct.aggregation.max.push(aggregation_callback_map.max(aggregation_data))
        switch (data_aggregation_type) {
            case 'min':
                struct.throughput.main = struct.throughput.min
                struct.error_rate.main = struct.error_rate.min
                struct.aggregation.main = struct.aggregation.min
                break
            case 'max':
                struct.throughput.main = struct.throughput.max
                struct.error_rate.main = struct.error_rate.max
                struct.aggregation.main = struct.aggregation.max
                break
            default:
                struct.throughput.main.push(aggregation_callback(group.throughput))
                struct.error_rate.main.push(aggregation_callback(group.error_rate))
                struct.aggregation.main.push(aggregation_callback(aggregation_data))
                break
        }
    })
    console.log('aggregated', struct)
    return struct
}

const change_aggregation_key = (grouped_data, aggregation_type, struct, group_aggregations_key) => {
    // O(n)
    const aggregation_callback = aggregation_callback_map[aggregation_type] || aggregation_callback_map.mean
    grouped_data.forEach(group => {
        const aggregation_data = group.aggregations[group_aggregations_key]
        !aggregation_data && console.warn(
            'No aggregation "', group_aggregations_key, '" data for ', group
        )
        struct.aggregation.min.push(aggregation_callback_map.min(aggregation_data))
        struct.aggregation.max.push(aggregation_callback_map.max(aggregation_data))
        switch (aggregation_type) {
            case 'min':
                struct.aggregation.main = struct.aggregation.min
                break
            case 'max':
                struct.aggregation.main = struct.aggregation.max
                break
            default:
                struct.aggregation.main.push(aggregation_callback(aggregation_data))
                break
        }
    })
    console.log('re-aggregated', struct)
    return struct
}

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


const dataset_main = (label = '', color = '#5933c6') => ({
    label: label,
    borderColor: color,
    pointBorderColor: color,
    pointBackgroundColor: color,
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: color,
    fill: false,
})

const dataset_max = gradient => ({
    ...dataset_main('max', gradient),
    borderDash: [5, 5],
    borderWidth: 1,
    fill: '+1',
    backgroundColor: '#ff800020',
    // backgroundColor: gradient,
})

const dataset_min = gradient => ({
    ...dataset_main('min', gradient),
    borderDash: [5, 5],
    borderWidth: 1,
    fill: '-1',
    backgroundColor: '#00800020',
    // backgroundColor: gradient,
})


const prepare_datasets = (chart_obj, data_node, draw_min_max, dataset_label = '') => {
    const datasets = []
    draw_min_max && datasets.push({
        ...dataset_max(get_gradient_max(chart_obj)),
        data: data_node.max
    })
    datasets.push({
        ...dataset_main(dataset_label),
        data: data_node.main,
    })
    draw_min_max && datasets.push({
        ...dataset_min(get_gradient_min(chart_obj)),
        data: data_node.min
    })
    return datasets
}

const update_chart = (chart_obj, chart_data, chart_options_plugins) => {
    chart_obj.data = chart_data
    Object.assign(chart_obj.options.plugins, chart_options_plugins)
    // chart_obj.options.plugins.tooltip = get_tooltip_options(
    //     this.aggregated_data_backend.aggregated_tests,
    //     this.aggregated_data_backend.names
    // )
    chart_obj.update()
}

const get_tooltip_options = (arr_amounts, arr_names) => ({
    callbacks: {
        footer: tooltip_items => {
            const tests_num = arr_amounts[tooltip_items[0].dataIndex]
            if (tests_num > 1) {
                return `${tests_num} tests aggregated`
            }
        },
        title: tooltip_items => {
            return arr_names[tooltip_items[0].dataIndex]
        },
    }
})

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
                    // maxTicksLimit: 6,
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
    chart_options.options.scales.x.ticks.maxTicksLimit = 6
    chart_options.options.scales.y.title.text = 'req/sec'
    chart_options.options.plugins.title.text = 'AVG. THROUGHPUT'
    window.charts.throughput = new Chart('throughput_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.x.ticks.maxTicksLimit = 6
    chart_options.options.scales.y.title.text = '%'
    chart_options.options.plugins.title.text = 'ERROR RATE'
    window.charts.error_rate = new Chart('error_rate_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.x.ticks.maxTicksLimit = 6
    chart_options.options.scales.y.title.text = 'ms'
    chart_options.options.plugins.title.text = 'RESPONSE TIME'
    window.charts.response_time = new Chart('response_time_chart', chart_options)

    chart_options = get_common_chart_options()
    chart_options.options.scales.x.ticks.maxTicksLimit = 6
    chart_options.options.scales.y.title.text = 'ms'
    chart_options.options.plugins.title.text = 'PAGE SPEED'
    window.charts.page_speed = new Chart('page_speed_chart', chart_options)
})