import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText, Circle, G } from 'react-native-svg';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: { data: number[]; color?: string; label?: string }[];
  };
  width?: number;
  height?: number;
  title?: string;
  lineColor?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 320,
  height = 200,
  title,
  lineColor = '#3b82f6',
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

  const minValue = Math.min(...chartData);
  const maxValue = Math.max(...chartData);
  const range = maxValue - minValue || 1;

  const xScale = (index: number) => padding.left + (index / (chartData.length - 1 || 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  const points = chartData.map((value, index) => `${xScale(index)},${yScale(value)}`).join(' ');

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minValue + (range * i) / yTicks);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yTickValues.map((tick, i) => (
          <G key={`grid-${i}`}>
            <Line
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </G>
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

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <SvgText
            key={`x-label-${i}`}
            x={xScale(i)}
            y={height - padding.bottom + 20}
            fontSize="10"
            fill="#6b7280"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}

        {/* Polyline */}
        <Polyline
          points={points}
          fill="none"
          stroke={datasets[0]?.color || lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {chartData.map((value, i) => (
          <Circle
            key={`point-${i}`}
            cx={xScale(i)}
            cy={yScale(value)}
            r="4"
            fill={datasets[0]?.color || lineColor}
          />
        ))}
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

export default LineChart;
