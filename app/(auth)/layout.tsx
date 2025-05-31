import React from 'react'

const AuthLayout = ({children} : {children : React.ReactNode}) => {
  return (
    <div className='flex justify-center py-40'>{children}</div>
  )
}

export default AuthLayout