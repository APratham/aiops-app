import 'chartjs-adapter-date-fns';
import { Chart, ChartTypeRegistry, ChartOptions, ChartType, ChartData, ChartConfiguration, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables, zoomPlugin);

export interface ContainerItem {
  label?: string;
  id?: string;
  name?: string;
  type?: 'Docker' | 'Kubernetes';
  content?: string;
  size?: 'square' | 'rectangle' | 'large-square' | 'large-rectangle' | 'long-rectangle' | 'graph-rectangle';
  cardType?: string;
  transform?: string;
  isDragging?: boolean;
  disabled?: boolean;
  image?: string;
  chartConfig?: ChartConfiguration<any>;  
}

export interface ChartConfigOptions {
  animate: boolean;
}

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options: ChartOptions;
}
