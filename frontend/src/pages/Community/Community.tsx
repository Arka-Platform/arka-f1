import React from 'react'
import CircleHub from '../../components/community/CircleHub/CircleHub'
import ChainStories from '../../components/community/ChainStories/ChainStories'
import styles from './Community.module.css'

const Community: React.FC = () => {
  return (
    <div className={styles.community}>
      <CircleHub />
      <ChainStories />
    </div>
  )
}

export default Community


