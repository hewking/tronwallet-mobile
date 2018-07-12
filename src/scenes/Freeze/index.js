import React, { Component } from 'react'
import { Linking, KeyboardAvoidingView, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicons from 'react-native-vector-icons/Ionicons'

import * as Utils from '../../components/Utils'
import Header from '../../components/Header'
import Input from '../../components/Input'
import Badge from '../../components/Badge'
import ButtonGradient from '../../components/ButtonGradient'
import { Colors } from '../../components/DesignSystem'

import Client from '../../services/client'
import { TronVaultURL } from '../../utils/deeplinkUtils'
import { signTransaction } from '../../utils/transactionUtils'
import { Context } from '../../store/context'

class FreezeScene extends Component {
  state = {
    from: '',
    balances: [],
    trxBalance: 0,
    bandwidth: 0,
    total: 0,
    amount: '',
    loading: true
  }

  componentDidMount () {
    this._didFocusSubscription = this.props.navigation.addListener(
      'didFocus',
      this.loadData
    )
  }

  componentWillUnmount () {
    this._didFocusSubscription.remove()
  }

  loadData = async () => {
    try {
      const { freeze, publicKey } = this.props.context
      const { balance } = freeze.value.balances.find(b => b.name === 'TRX')

      this.setState({
        from: publicKey.value,
        balances: freeze,
        trxBalance: balance,
        bandwidth: freeze.value.bandwidth.netReimaining,
        total: freeze.value.total,
        loading: false
      })
    } catch (error) {
      this.setState({
        loading: false
      })
    }
  }

  submit = async () => {
    const { amount, trxBalance } = this.state
    const convertedAmount = Number(amount)

    this.setState({ loading: true })
    try {
      if (trxBalance < convertedAmount) { throw new Error('Insufficient TRX balance') }
      await this.freezeToken()
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      this.setState({ loading: false })
    }
  }

  freezeToken = async () => {
    const { amount } = this.state
    const convertedAmount = Number(amount)

    try {
      const data = await Client.getFreezeTransaction(convertedAmount)
      this.openTransactionDetails(data)
    } catch (error) {
      Alert.alert('Error while building transaction, try again.')
      this.setState({ error: 'Error getting transaction', loadingSign: false })
    }
  }

  openTransactionDetails = async transactionUnsigned => {
    try {
      const transactionSigned = await signTransaction(transactionUnsigned)
      this.setState({ loadingSign: false }, () => {
        this.props.navigation.navigate('TransactionDetail', {
          tx: transactionSigned
        })
      })
    } catch (error) {
      Alert.alert(error.message)
      this.setState({ error: 'Error getting transaction', loadingSign: false })
    }
  }

  openDeepLink = async dataToSend => {
    try {
      const url = `${TronVaultURL}auth/${dataToSend}`
      await Linking.openURL(url)
      this.setState({ loading: false })
    } catch (error) {
      this.setState({ loading: false }, () => {
        this.props.navigation.navigate('GetVault')
      })
    }
  }

  _changeFreeze = value => {
    const validation = /^0[0-9]/
    let amount = validation.test(value) ? value.slice(1, value.length) : value

    this.setState({
      amount: amount
    })
  }

  _leftContent = () => (
    <Utils.View marginRight={8} marginLeft={8}>
      <Ionicons name='ios-unlock' size={16} color={Colors.secondaryText} />
    </Utils.View>
  )

  render () {
    const { trxBalance, amount } = this.state

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background }}
        enabled
      >
        <KeyboardAwareScrollView contentContainerStyle={{ flex: 1 }}>
          <Utils.StatusBar />
          <Utils.Container>
            <Header>
              <Utils.View align='center'>
                <Utils.Text size='xsmall' secondary>
                  FREEZE
                </Utils.Text>
                <Utils.Row align='center'>
                  <Utils.Text size='huge'>{trxBalance.toFixed(2)}</Utils.Text>
                  <Utils.HorizontalSpacer />
                  <Badge>TRX</Badge>
                </Utils.Row>
              </Utils.View>
            </Header>
            <Utils.Content>
              <Input
                label='FREEZE AMOUNT'
                leftContent={this._leftContent}
                keyboardType='numeric'
                align='right'
                value={amount}
                onChangeText={value => this._changeFreeze(value)}
                placeholder='0'
              />
              <Utils.SummaryInfo
              >{`New freeze TRX: ${amount}`}</Utils.SummaryInfo>
              <ButtonGradient
                text='FREEZE'
                onPress={this.submit}
                marginVertical='large'
              />
            </Utils.Content>
          </Utils.Container>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    )
  }
}

export default props => (
  <Context.Consumer>
    {context => <FreezeScene context={context} {...props} />}
  </Context.Consumer>
)
