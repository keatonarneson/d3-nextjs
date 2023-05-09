import styles from '@/styles/Home.module.css';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// https://tympanus.net/codrops/2022/03/29/building-an-interactive-sparkline-graph-with-d3/
// https://ncoughlin.com/posts/d3-mean-line-tooltip/

// https://ghenshaw-work.medium.com/customizing-axes-in-d3-js-99d58863738b
// https://d3-graph-gallery.com/graph/custom_axis.html

// https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/

// import { line, area, curveBumpX } from 'd3-shape';
// import { select, selectAll } from 'd3-selection';
// import { timeFormat } from 'd3-time-format';
// import { extent } from 'd3-array';

export default function Home({ sampleData }) {
    const svgRef = useRef();
    const wrapperRef = useRef();
    const dataChartRef = useRef();

    const sortData = data => {
        /* Convert to date object */
        return (
            data
                .map(d => {
                    return {
                        ...d,
                        date: new Date(d.date),
                    };
                })
                /* Sort in ascending order */
                .sort((a, b) => d3.ascending(a.date, b.date))
        );
    };

    const dimensions = {
        width: 600,
        height: 400,
        marginTop: 30,
        marginBottom: 30,
        marginLeft: 50,
    };

    const xAccessor = d => d.date;
    const yAccessor = d => d.stuff;

    const draw = data => {
        console.log(data);
        const wrapper = d3.select(wrapperRef.current);

        const svg =
            /* Select the `figure` */
            d3
                .select(dataChartRef.current)
                /* Append the SVG */
                .append('svg')
                .attr('width', dimensions.width)
                .attr('height', dimensions.height)
                .attr(
                    'viewBox',
                    `0 0 ${dimensions.width} ${dimensions.height}`
                );

        const xDomain = d3.extent(data, xAccessor);
        const xScale = d3
            .scaleTime()
            .domain(xDomain)
            // .range([0, dimensions.width]);
            .range([dimensions.marginLeft, dimensions.width]);

        // const yDomain = [0, d3.max(data, yAccessor)];
        const yDomain = [50, 150];

        const yScale = d3
            .scaleLinear()
            .domain(yDomain)
            .range([
                dimensions.height - dimensions.marginBottom,
                dimensions.marginTop,
            ]);

        /* Line */
        const lineGenerator = d3
            .line()
            .x(d => xScale(xAccessor(d)))
            .y(d => yScale(yAccessor(d)))
            .curve(d3.curveBumpX);

        const line = svg
            /* Append `path` */
            .append('path')
            /* Bind the data */
            .datum(data)
            /* Pass the generated line to the `d` attribute */
            .attr('d', lineGenerator)
            /* Set some styles */
            .attr('stroke', 'var(--stroke)')
            .attr('stroke-width', 2)
            .attr('stroke-linejoin', 'round')
            .attr('fill', 'none');

        /* Area */
        // const areaGenerator = d3
        //     .area()
        //     .x(d => xScale(xAccessor(d)))
        //     .y1(d => yScale(yAccessor(d)))
        //     .y0(dimensions.height)
        //     .curve(d3.curveBumpX);

        // const area = svg
        //     .append('path')
        //     .datum(data)
        //     .attr('d', areaGenerator)
        //     .attr('fill', 'var(--fill)');

        const markerLine = svg
            .append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', dimensions.marginBottom)
            .attr('y2', dimensions.height - dimensions.marginTop)
            .attr('stroke-width', 3)
            .attr('stroke', 'var(--marker, var(--stroke))')
            .attr('opacity', 0);

        const markerDot = svg
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 5)
            .attr('fill', 'var(--marker, var(--stroke))')
            .attr('opacity', 0);

        svg.on('mousemove', e => {
            const pointerCoords = d3.pointer(e);
            const [posX, posY] = pointerCoords;

            markerLine.attr('x1', posX).attr('x2', posX).attr('opacity', 1);

            markerDot.attr('cx', posX).attr('cy', posY).attr('opacity', 1);
        });

        svg.on('mousemove', e => {
            const pointerCoords = d3.pointer(e);
            const [posX, posY] = pointerCoords;

            /* Find date from position */
            const date = xScale.invert(posX);
        });

        const bisect = d3.bisector(xAccessor);

        svg.on('mousemove', e => {
            const pointerCoords = d3.pointer(e);
            const [posX, posY] = pointerCoords;

            /* Find date from position */
            const date = xScale.invert(posX);

            /* Find the closest data point */
            const index = bisect.center(data, date);
            const d = data[index];

            const x = xScale(xAccessor(d));
            const y = yScale(yAccessor(d));

            markerLine.attr('x1', x).attr('x2', x).attr('opacity', 1);

            markerDot.attr('cx', x).attr('cy', y).attr('opacity', 1);

            d3.select('[data-heading]').text(getText(data, d));

            d3.select('[data-total]').text(yAccessor(d) + ' Stuff+');
        });

        svg.on('mouseleave', () => {
            const lastDatum = data[data.length - 1];

            /* Hide the markers */
            markerLine.attr('opacity', 0);
            markerDot.attr('opacity', 0);

            /* Reset the text to show latest value */
            d3.select('[data-heading]').text('Stuff+');
            d3.select('[data-total]').text(yAccessor(lastDatum));
        });

        const meanLine = svg.append('line').classed('mean-line', true);

        // calculate mean
        // const mean = d3.mean(sampleData, xAccessor);
        const mean = 100;

        meanLine
            // .raise()
            // .transition(updateTransition)
            .attr('x1', dimensions.marginLeft)
            .attr('y1', yScale(mean))
            .attr('x2', dimensions.width)
            .attr('y2', yScale(mean))
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('stroke', 'white');

        // --------------- ticks ---------------------------------------

        // const yAxisGenerator = d3.axisLeft(yScale);

        // yAxisGenerator.ticks(3);

        // const tickLabels = [50, 'Lg Avg 100', 150];
        // yAxisGenerator.tickFormat((d, i) => tickLabels[i]);

        // const yAxis = svg.append('g').call(yAxisGenerator);

        // yAxis.selectAll('.tick line').attr('fill', 'white').attr('stroke', 5);

        // svg.append('g')
        //     .attr('transform', 'translate(50,0)')
        //     .call(d3.axisLeft(yScale));

        const tickLabels = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];

        const yAxis = d3
            .axisLeft(yScale)
            .tickSize(-600)
            .ticks(11)
            .tickFormat((d, i) => tickLabels[i]);

        const gYAxis = svg.append('g').attr('transform', 'translate(50, 0)');

        gYAxis
            .call(yAxis)
            .append('text')
            .attr('class', 'axis-label')
            .text('Lg Avg 100')
            .attr('transform', 'rotate(-90)')
            .attr(
                'x',
                -(
                    (dimensions.height -
                        dimensions.marginTop -
                        dimensions.marginBottom) /
                    2
                )
            )
            .attr('y', -30)
            .attr('fill', 'white');

        gYAxis.selectAll('.tick line').attr('opacity', 0.1);

        const xAxis = d3.axisBottom(xScale).tickSize(0).tickFormat('');

        const gXAxis = svg
            .append('g')
            .attr(
                'transform',
                `translate(0, ${dimensions.height - dimensions.marginBottom})`
            );
        gXAxis
            .call(xAxis)
            .append('text')
            .attr('class', 'axis-label')
            .text('2023')
            .attr('y', 20)
            .attr('x', (dimensions.width + dimensions.marginLeft) / 2)
            .attr('fill', 'white');
    };

    const formatDate = d3.timeFormat('%Y-%m-%d');

    const getText = (data, d) => {
        /* Current date */
        const to = xAccessor(d);

        /* Date one week previously */
        const from = d3.timeDay.offset(to, -7);

        return `${formatDate(to)}`;
    };

    const color = () => {
        const inputs = d3.selectAll('input[type="radio"]');

        const colors = inputs.nodes().map(input => {
            return input.value;
        });

        d3.select('.controls-list').on('click', e => {
            const { value, checked } = e.target;

            if (!value || !checked) return;

            document.body.classList.remove(...colors);
            document.body.classList.add(value);
        });
    };

    useEffect(() => {
        console.log('use effect');
        draw(sortData(sampleData));
        color();
    }, [sampleData]);

    return (
        <>
            <div className="chart-wrapper" ref={wrapperRef} data-wrapper>
                <div>
                    <h3 data-heading>Stuff+</h3>
                    <p data-total>800</p>
                </div>
                {/* <figure data-chart></figure> */}
                <figure ref={dataChartRef}></figure>
                {/* <svg ref={svgRef} /> */}
            </div>
        </>
    );
}

export const getServerSideProps = async () => {
    const sampleData = [
        {
            date: '2023-04-01T04:32:20Z',
            stuff: 91,
        },
        {
            date: '2023-04-05T04:32:20Z',
            stuff: 95,
        },
        {
            date: '2023-04-10T04:32:20Z',
            stuff: 93,
        },
        {
            date: '2023-04-15T04:32:20Z',
            stuff: 101,
        },
        {
            date: '2023-04-20T04:32:20Z',
            stuff: 99,
        },
        {
            date: '2023-04-25T04:32:20Z',
            stuff: 92,
        },
        {
            date: '2023-04-30T04:32:20Z',
            stuff: 95,
        },
        {
            date: '2023-05-05T04:32:20Z',
            stuff: 103,
        },
        {
            date: '2023-05-10T04:32:20Z',
            stuff: 102,
        },
        {
            date: '2023-05-15T04:32:20Z',
            stuff: 99,
        },
        {
            date: '2023-05-20T04:32:20Z',
            stuff: 105,
        },
        {
            date: '2023-05-25T04:32:20Z',
            stuff: 102,
        },
    ];

    function getData() {
        return d3
            .json('https://mocki.io/v1/11ccc89c-9b46-4790-adc1-fcb64403d2e9')
            .then(response => response.json())
            .then(data => {
                const sortedData = sortData(data);
                draw(sortedData);
            })
            .catch(error => console.log(error));
    }

    return {
        props: {
            sampleData: sampleData,
        },
    };
};
