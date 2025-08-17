// Custom lightweight CSS imports for iframe
import 'remixicon/fonts/remixicon.css';
import 'react-phone-number-input/style.css';

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      background: 'white',
      minHeight: '100vh'
    }}>
      {children}
    </div>
  );
}
