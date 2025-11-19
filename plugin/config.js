import config from '../config.js'

export default (context, inject) => {
  inject('config', config)
}
