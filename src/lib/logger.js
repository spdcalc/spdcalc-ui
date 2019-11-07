
export function log( ...args ){
  if ( process.env.NODE_ENV !== 'production' ){
    console.log.apply(console, args)
  }
}

export function logErr( ...args ){
  if ( process.env.NODE_ENV !== 'production' ){
    console.error.apply(console, args)
  }
}
