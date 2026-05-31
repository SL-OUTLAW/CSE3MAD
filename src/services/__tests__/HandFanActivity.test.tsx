// HandFanActivity.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HandFanActivity from '../../screens/HandFanActivity';
import { useAccessibility } from '../../../context/AccessibilityContext';

jest.mock('../../../context/AccessibilityContext', () => ({
  useAccessibility: jest.fn(),
}));

describe('HandFanActivity - calculation with valid input', () => {
  const mockOnBack = jest.fn();
  const mockOnLogResults = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAccessibility as jest.Mock).mockReturnValue({
      colours: {
        background: '#fff',
        card: '#fff',
        border: '#ccc',
        text: '#000',
        subText: '#666',
        primary: '#1d5db1',
        danger: '#F08787',
        success: '#A3DC9A',
      },
      highContrast: false,
      textScale: 1,
    });
  });

  it('calculates correct bend angle and force for 30°, 0.1mm thickness', () => {
    const { getByText, getByPlaceholderText } = render(
      <HandFanActivity onBack={mockOnBack} onLogResults={mockOnLogResults} onSubmit={mockOnSubmit} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. 30'), '30');
    expect(getByText('30°')).toBeTruthy();
    expect(getByText('0.0262 N')).toBeTruthy(); // 0.05 * (30*pi/180) = 0.02618 -- rounded to 4 decimals
  });

  it('calculates correctly for 0.5mm material and 45°', () => {
    const { getByText, getByPlaceholderText } = render(
      <HandFanActivity onBack={mockOnBack} onLogResults={mockOnLogResults} onSubmit={mockOnSubmit} />
    );
    fireEvent.press(getByText('0.5\nmm'));
    fireEvent.changeText(getByPlaceholderText('e.g. 30'), '45');
    expect(getByText('45°')).toBeTruthy();
    expect(getByText('0.3927 N')).toBeTruthy(); // 0.5 * (45*pi/180) = 0.3927
  });

  it('handles decimal bend angle (12.5°)', () => {
    const { getByText, getByPlaceholderText } = render(
      <HandFanActivity onBack={mockOnBack} onLogResults={mockOnLogResults} onSubmit={mockOnSubmit} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. 30'), '12.5');
    expect(getByText('12.5°')).toBeTruthy();
    // force = 0.05 * (12.5*pi/180) = 0.0109 (rounded to 4 decimals)
    expect(getByText('0.0109 N')).toBeTruthy();
  });

  it('shows 0° and 0 N when angle input is empty', () => {
    const { getByText, getByPlaceholderText } = render(
      <HandFanActivity onBack={mockOnBack} onLogResults={mockOnLogResults} onSubmit={mockOnSubmit} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. 30'), '');
    expect(getByText('0°')).toBeTruthy();
    expect(getByText('0 N')).toBeTruthy();
  });

  it('treats invalid input as 0° and 0 N', () => {
    const { getByText, getByPlaceholderText } = render(
      <HandFanActivity onBack={mockOnBack} onLogResults={mockOnLogResults} onSubmit={mockOnSubmit} />
    );
    fireEvent.changeText(getByPlaceholderText('e.g. 30'), 'not a number');
    expect(getByText('0°')).toBeTruthy();
    expect(getByText('0 N')).toBeTruthy();
  });

  it('logs results with correct derived values (including movement level)', () => {
    const { getByText, getByPlaceholderText } = render(
      <HandFanActivity onBack={mockOnBack} onLogResults={mockOnLogResults} onSubmit={mockOnSubmit} />
    );
    fireEvent.press(getByText('0.25\nmm')); // stiffness = 0.2
    fireEvent.changeText(getByPlaceholderText('e.g. 30'), '20');

    fireEvent.press(getByText('Log Results'));

    expect(mockOnLogResults).toHaveBeenCalledTimes(1);
    expect(mockOnLogResults).toHaveBeenCalledWith({
      defaultMeasuredValue: '20',
      distanceCm: '15',
      materialThicknessMm: '0.25\nmm',
      fanDesign: '',
      prediction: '',
      bendAngleDeg: '20',
      bendAngleRad: '0.35',        
      stiffnessNPerRad: '0.2',
      estimatedForceN: '0.0698',
      movementLevel: 'Moderate movement',
      observation: '',
      videoAttached: 'false',
    });
  });
});