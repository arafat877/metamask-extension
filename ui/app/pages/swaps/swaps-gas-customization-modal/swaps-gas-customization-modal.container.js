import { connect } from 'react-redux'
import {
  hideModal,
  setSwapsTxGasParams,
} from '../../../store/actions'
import {
  conversionRateSelector as getConversionRate,
  getCurrentCurrency,
  getCurrentEthBalance,
  getDefaultActiveButtonIndex,
  isCustomPriceSafe,
  getRenderableGasButtonData,
} from '../../../selectors'

import {
  getSwapsCustomizationModalPrice,
  getSwapsCustomizationModalLimit,
  getSwapGasEstimateLoadingStatus,
  getSwapGasPriceEstimateData,
  setSwapsCustomizationModalPrice,
  setSwapsCustomizationModalLimit,
} from '../../../ducks/swaps/swaps'

import {
  addHexes,
  getValueFromWeiHex,
  sumHexWEIsToRenderableFiat,
} from '../../../helpers/utils/conversions.util'
import {
  formatETHFee,
} from '../../../helpers/utils/formatters'
import {
  calcGasTotal,
  isBalanceSufficient,
} from '../../send/send.utils'
import SwapsGasCustomizationModalComponent from './swaps-gas-customization-modal.component'

const mapStateToProps = (state) => {
  const currentCurrency = getCurrentCurrency(state)
  const conversionRate = getConversionRate(state)

  const { modalState: { props: modalProps } = {} } = state.appState.modal || {}
  const {
    txParams = {},
    customGasLimitMessage = '',
    customTotalSupplement = '',
    extraInfoRow = null,
    initialGasPrice,
    initialGasLimit,
  } = modalProps || {}
  const buttonDataLoading = getSwapGasEstimateLoadingStatus(state)

  const swapsCustomizationModalPrice = getSwapsCustomizationModalPrice(state)
  const swapsCustomizationModalLimit = getSwapsCustomizationModalLimit(state)

  const customGasPrice = swapsCustomizationModalPrice || initialGasPrice
  const customGasLimit = swapsCustomizationModalLimit || initialGasLimit

  const { value } = txParams
  const customGasTotal = calcGasTotal(customGasLimit, customGasPrice)

  const swapsGasPriceEstimates = getSwapGasPriceEstimateData(state)

  const {
    averageEstimateData,
    fastEstimateData,
  } = getRenderableGasButtonData(swapsGasPriceEstimates, customGasLimit, true, conversionRate, currentCurrency)
  const gasButtonInfo = [averageEstimateData, fastEstimateData]

  const newTotalFiat = sumHexWEIsToRenderableFiat(
    [value, customGasTotal, customTotalSupplement],
    currentCurrency,
    conversionRate,
  )

  const balance = getCurrentEthBalance(state)

  const newTotalEth = sumHexWEIsToRenderableEth([value, customGasTotal, customTotalSupplement])

  const sendAmount = sumHexWEIsToRenderableEth([value, '0x0'])

  const insufficientBalance = !isBalanceSufficient({
    amount: value,
    gasTotal: customGasTotal,
    balance,
    conversionRate,
  })

  return {
    customGasPrice,
    customGasLimit,
    customPriceIsSafe: isCustomPriceSafe(state, true),
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      defaultActiveButtonIndex: getDefaultActiveButtonIndex(gasButtonInfo, customGasPrice),
      gasButtonInfo,
    },
    infoRowProps: {
      originalTotalFiat: sumHexWEIsToRenderableFiat(
        [value, customGasTotal, customTotalSupplement],
        currentCurrency,
        conversionRate,
      ),
      originalTotalEth: sumHexWEIsToRenderableEth(
        [value, customGasTotal, customTotalSupplement],
      ),
      newTotalFiat,
      newTotalEth,
      transactionFee: sumHexWEIsToRenderableEth(['0x0', customGasTotal]),
      sendAmount,
      extraInfoRow,
    },
    insufficientBalance,
    customGasLimitMessage,
    conversionRate,
    value,
  }
}

const mapDispatchToProps = (dispatch) => {

  return {
    cancelAndClose: () => {
      dispatch(hideModal())
    },
    onSubmit: (gasLimit, gasPrice) => {
      dispatch(setSwapsTxGasParams(gasLimit, gasPrice))
      dispatch(hideModal())
    },
    setSwapsCustomizationModalPrice: (newPrice) => {
      dispatch(setSwapsCustomizationModalPrice(newPrice))
    },
    setSwapsCustomizationModalLimit: (newLimit) => {
      dispatch(setSwapsCustomizationModalLimit(newLimit))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SwapsGasCustomizationModalComponent)

function sumHexWEIsToRenderableEth (hexWEIs) {
  const hexWEIsSum = hexWEIs.filter((n) => n).reduce(addHexes)
  return formatETHFee(getValueFromWeiHex({
    value: hexWEIsSum,
    toCurrency: 'ETH',
    numberOfDecimals: 6,
  }))
}
