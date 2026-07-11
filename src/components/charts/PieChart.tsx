import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText, G, Path } from 'react-native-svg';

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor?: string;
}

interface PieChartProps {
  data: PieChartData[];
  width?: number;
  height?: number;
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 320,
  height = 300,
  title,
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.population, 0);
  const centerX = width / 2;
  const centerY = 120;
  const radius = 80;
  const innerRadius = 50; // for donut effect

  let currentAngle = -90; // Start from top

  const slices = data.map((item) => {
    const percentage = item.population / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    const endAngle = currentAngle;

    // Calculate arc paths
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const ix1 = centerX + innerRadius * Math.cos(startRad);
    const iy1 = centerY + innerRadius * Math.sin(startRad);
    const ix2 = centerX + innerRadius * Math.cos(endRad);
    const iy2 = centerY + innerRadius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // Outer arc path
    const outerPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    // Inner arc path
    const innerPath = `M ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`;
    // Close path
    const closePath = 'L ' + x1 + ' ' + y1 + ' Z';

    const pathD = `${outerPath} ${innerPath} ${closePath}`;

    return {
      ...item,
      path: pathD,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height - 100}>
        {slices.map((slice, i) => (
          <Path key={`slice-${i}`} d={slice.path} fill={slice.color} />
        ))}
      </Svg>
      <View style={styles.legend}>
        {slices.map((slice, i) => (
          <View key={`legend-${i}`} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={[styles.legendText, { color: slice.legendFontColor || '#374151' }]}>
              {slice.name}: {slice.percentage}%
            </Text>
          </View>
        ))}
      </View>
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});

export default PieChart;
