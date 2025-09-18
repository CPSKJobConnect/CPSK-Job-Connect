// Button component tests using Jest and React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with default text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant and size', () => {
    render(
      <Button variant="destructive" size="lg">
        Danger
      </Button>
    );
    const btn = screen.getByText('Danger');
    expect(btn).toHaveClass('bg-destructive'); // check one class from variant
    expect(btn).toHaveClass('h-10'); // check one class from size
  });

  it('renders as a child if asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    );
    const link = screen.getByText('Link');
    expect(link.tagName).toBe('A');
  });
});
