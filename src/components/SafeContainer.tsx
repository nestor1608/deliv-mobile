import { Host } from '@expo/ui';
export default function SafeContainer({ children, style }) {
    return <Host style={style}>{children}</Host>;
}
