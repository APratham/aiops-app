export interface ContainerItem {
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
}