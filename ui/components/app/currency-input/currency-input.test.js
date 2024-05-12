import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import CurrencyInput from '.';

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

describe('CurrencyInput Component', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);

  const mockStore = {
    metamask: {
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 231.06,
        },
      },
      providerConfig: {
        chainId: '0x5',
        ticker: 'ETH',
      },
      preferences: {
        showFiatInTestnets: true,
      },
      useCurrencyRateCheck: true,
    },
  };
  describe('rendering', () => {
    it('should render properly without a suffix', () => {
      const store = configureMockStore()(mockStore);

      const { container } = renderWithProvider(<CurrencyInput />, store);

      expect(container).toMatchSnapshot();
    });

    it('should render properly with an ETH value', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        hexValue: 'de0b6b3a7640000',
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render properly with a fiat value', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render properly with a native value when hideSecondary is true', () => {
      const hideSecondaryState = {
        metamask: {
          ...mockStore.metamask,
          preferences: {
            showFiatInTestnets: false,
          },
          hideSecondary: true,
        },
      };

      const store = configureMockStore()(hideSecondaryState);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render small number properly', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '174876e800',
        isFiatPreferred: false,
      };

      const { getByTestId } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const { value } = getByTestId('currency-input');

      expect(value).toStrictEqual('0.0000001');
    });
  });

  describe('handling actions', () => {
    it('should call onChange on input changes with the hex value for ETH', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
      };

      const { queryByTestId, queryByTitle, rerender } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const currencyInput = queryByTestId('currency-input');
      fireEvent.change(currencyInput, { target: { value: 1 } });

      expect(props.onChange).toHaveBeenCalledWith('0xde0b6b3a7640000');
      // assume the onChange function updates the hexValue
      rerender(<CurrencyInput {...props} hexValue="0xde0b6b3a7640000" />);

      expect(queryByTitle('$231.06')).toBeInTheDocument();
    });

    it('should call onChange on input changes with the hex value for fiat', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { queryByTestId, queryByTitle } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const currencyInput = queryByTestId('currency-input');

      fireEvent.change(currencyInput, { target: { value: 1 } });

      expect(props.onChange).toHaveBeenCalledWith('0xf604b06968000');
      expect(queryByTitle('0.004328 ETH')).toBeInTheDocument();
    });

    it('should swap selected currency when swap icon is clicked', async () => {
      const store = configureMockStore()(mockStore);
      const props = {
        onChange: jest.fn(),
        onPreferenceToggle: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { queryByTestId, queryByTitle, rerender } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const currencyInput = queryByTestId('currency-input');
      fireEvent.change(currencyInput, { target: { value: 1 } });

      expect(queryByTitle('0.004328 ETH')).toBeInTheDocument();

      const currencySwap = queryByTestId('currency-swap');
      fireEvent.click(currencySwap);

      // expect isFiatPreferred to update
      rerender(<CurrencyInput {...props} isFiatPreferred={false} />);

      await waitFor(() => {
        expect(queryByTitle('$1.00')).toBeInTheDocument();
      });
    });
  });
});
