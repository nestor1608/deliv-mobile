import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: { data: number[]; color?: string }[];
  };
  width?: number;
  height?: number;
  title?: string;
  barColor?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 320,
  height = 200,
  title,
  barColor = '#3b82f6',
}) => {
  const { labels, datasets } = data;
  const chartData = datasets[0]?.data || [];

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minValue = 0;
  const maxValue = Math.max(...chartData, 1);
  const range = maxValue - minValue;

  const barWidth = chartWidth / chartData.length * 0.7;
  const barSpacing = chartWidth / chartData.length * 0.3;

  const xScale = (index: number) => padding.left + index * (barWidth + barSpacing) + barSpacing / 2;
  const yScale = (value: number) => padding.top + chartHeight - (value / range) * chartHeight;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (range * i) / yTicks);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yTickValues.map((tick, i) => (
          <Line
            key={`grid-${i}`}
            x1={padding.left}
            y1={yScale(tick)}
            x2={width - padding.right}
            y2={yScale(tick)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* X-axis */}
        <Line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* Y-axis ticks and labels */}
        {yTickValues.map((tick, i) => (
          <G key={`y-tick-${i}`}>
            <Line
              x1={padding.left - 5}
              y1={yScale(tick)}
              x2={padding.left}
              y2={yScale(tick)}
              stroke="#9ca3af"
              strokeWidth="1"
            />
            <SvgText
              x={padding.left - 10}
              y={yScale(tick) + 4}
              fontSize="10"
              fill="#6b7280"
              textAnchor="end"
            >
              {tick.toFixed(0)}
            </SvgText>
          </G>
        ))}

        {/* Bars */}
        {chartData.map((value, i) => {
          const barHeight = (value / range) * chartHeight;
          return (
            <G key={`bar-${i}`}>
              <Rect
                x={xScale(i)}
                y={yScale(value)}
                width={barWidth}
                height={barHeight}
                fill={datasets[0]?.color || barColor}
                rx="4"
                ry="4"
              />
              <SvgText
                x={xScale(i) + barWidth / 2}
                y={height - padding.bottom + 20}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {labels[i]}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  noData: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
});

export default BarChart;
