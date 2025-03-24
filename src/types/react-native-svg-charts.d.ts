declare module 'react-native-svg-charts' {
  export interface ChartDataPoint {
    value: number;
    key: string;
    svg: {
      fill: string;
    };
    arc?: {
      innerRadius?: number;
      padAngle?: number;
    };
  }

  export interface PieChartProps {
    data: ChartDataPoint[];
    style?: any;
    innerRadius?: number;
    outerRadius?: number;
    padAngle?: number;
    animate?: boolean;
    animationDuration?: number;
  }

  export class PieChart extends React.Component<PieChartProps> {}
} 