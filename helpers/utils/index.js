const api = require('../../modules/api');
const config = require('../../modules/configReader');
const adm_utils = require('./adm_utils');
const log = require('../log');
const db = require('../../modules/DB');
const Store = require('../../modules/Store');

module.exports = {
	unix() {
		return new Date().getTime();
	},
	sendAdmMsg(address, msg, type = 'message') {
		if (msg) {
			try {
				return api.send(config.passPhrase, address, msg, type).success || false;
			} catch (e) {
				return false;
			}
		}
	},
	thousandSeparator(num, doBold) {
		var parts = (num + '').split('.'),
			main = parts[0],
			len = main.length,
			output = '',
			i = len - 1;

		while (i >= 0) {
			output = main.charAt(i) + output;
			if ((len - i) % 3 === 0 && i > 0) {
				output = ' ' + output;
			}
			--i;
		}

		if (parts.length > 1) {
			if (doBold) {
				output = `**${output}**.${parts[1]}`;
			} else {
				output = `${output}.${parts[1]}`;
			}
		}
		return output;
	},
	async getAddressCryptoFromAdmAddressADM(coin, admAddress) {
		try {
			if (this.isERC20(coin)) {
				coin = 'ETH';
			}
			const resp = await api.syncGet(`/api/states/get?senderId=${admAddress}&key=${coin.toLowerCase()}:address`);
			if (resp && resp.success) {
				if (resp.transactions.length) {
					return resp.transactions[0].asset.state.value;
				} else {
					return 'none';
				};
			};
		} catch (e) {
			log.error(' in getAddressCryptoFromAdmAddressADM(): ' + e);
			return null;
		}
	},
	async userDailyValue(senderId){
		return (await db.paymentsDb.find({
			transactionIsValid: true,
			senderId: senderId,
			needToSendBack: false,
			inAmountMessageUsd: {$ne: null},
			date: {$gt: (this.unix() - 24 * 3600 * 1000)} // last 24h
		})).reduce((r, c) => {
			return +r + +c.inAmountMessageUsd;
		}, 0);
	},
	async updateAllBalances(){
		try {
			await this.ADM.updateBalance();
		} catch (e){}
	},
	async getLastBlocksNumbers() {
		const data = {
			ADM: await this.ADM.getLastBlockNumber(),
		};
		return data;
	},
	isKnown(coin){
		return config.known_crypto.includes(coin);
	},
	isAccepted(coin){
		return config.accepted_crypto.includes(coin);
	},
	isExchanged(coin){
		return config.exchange_crypto.includes(coin);
	},
	isFiat(coin){
		return ['USD', 'RUB', 'EUR', 'CNY', 'JPY'].includes(coin);
	},
	isHasTicker(coin){ // if coin has ticker like COIN/OTHERCOIN or OTHERCOIN/COIN
		const pairs = Object.keys(Store.currencies).toString();
		return pairs.includes(',' + coin + '/') || pairs.includes('/' + coin);
	},
	isERC20(coin){
		return config.erc20.includes(coin.toUpperCase());
	},
	getPairObj(aPair, letCoin1only = false) {

		let pair = (aPair || '').toUpperCase().trim();
		let coin1Decimals = 8;
		let coin2Decimals = 8;
		let isPairFromParam = true;
		let coin1, coin2;
	
		if (!pair || pair.indexOf('/') === -1 || pair === config.pair) { // Set default pair
			if (pair != config.pair)
				isPairFromParam = false;
			if ((pair.indexOf('/') === -1) && letCoin1only) { // Not a pair, may be a coin only
				coin1 = pair;
				if (coin1 === config.coin1)
					coin1Decimals = config.coin1Decimals;		
				pair = null;
				coin2 = null;
			} else { // A pair
				pair = config.pair;
				coin1Decimals = config.coin1Decimals;
				coin2Decimals = config.coin2Decimals;
			}
		}
	
		if (pair) {
			coin1 = pair.substr(0, pair.indexOf('/')); 
			coin2 = pair.substr(pair.indexOf('/') + 1, pair.length);
		}
	
		return {
			pair,
			coin1,
			coin2,
			coin1Decimals,
			coin2Decimals,
			isPairFromParam
		}
	},
	randomValue(low, high, doRound = false) {
		let random = Math.random() * (high - low) + low;
		if (doRound)
			random = Math.round(random);
		return random;
	},
	randomDeviation(number, deviation) {
		const min = number - number * deviation;
		const max = number + number * deviation;
		return Math.random() * (max - min) + min;
	},
	getPrecision(decimals) {
		return +(Math.pow(10, -decimals).toFixed(decimals))
	},
	getModuleName(id) {
		let n = id.lastIndexOf("\\");
		if (n === -1)
			n = id.lastIndexOf("/");
		if (n === -1)
			return ''
		else
			return id.substring(n + 1);
	},
	parseRangeOrValue(str) {

		if (!str) {
			return {
				isRange: false,
				isValue: false
			}
		}
		
		let from, to, value;
		if (str.indexOf('-') > -1) { // hyphen
			[from, to] = str.split('-');
		} else if (str.indexOf('—') > -1) { // long dash
			[from, to] = str.split('—');
		} else if (str.indexOf('–') > -1) { // short dash
			[from, to] = str.split('–');
		} else if (str.indexOf('−') > -1) { // minus
			[from, to] = str.split('−');
		} else {
			value = +str;
			if (!value || value === Infinity) {
				return {
					isRange: false,
					isValue: false
				}
			} else {
				return {
					isRange: false,
					isValue: true,
					value
				}
			}
		}

		from = +from;
		to = +to;

		if (!from || from === Infinity || !to || to === Infinity) {
			return {
				isRange: false,
				isValue: false
			}
		}
		
		return {
			isRange: true,
			isValue: false,
			from,
			to
		};

	},
	ADM: adm_utils
};
