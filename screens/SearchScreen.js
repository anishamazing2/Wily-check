import React from 'react';
import { Text, View, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import db from '../config';


export default class Searchscreen extends React.Component {
  constructor(props){
    super(props);
    this.state={
      allTransactions:[]
    }
  }
  componentDidMount=async()=>{
    const query=await db.collection("transaction").get()
    query.docs.map((doc)=>{
      this.setState({
        allTransaction:[...this.state.allTransactions,doc.data()]
      })
    })
  }
    render() {
      return (
        <FlatList data={this.state.allTransactions}
        renderItem={({item})=>(
          <View  style={{borderBottomWidth:2}}>
                  <Text>
                    {"Book Id: "+transaction.bookId}
                  </Text>
                  <Text>
                    {"Student Id: "+transaction.studentId}
                  </Text>
                  <Text>
                    {"Transaction Type: "+ transaction.transactionType}
                  </Text>
                  <Text>
                    {"Date: "+transaction.date.toDate()}
                  </Text>
          </View>
        )}
        keyExtractor={(item,index)=>index.toString()}/>
          
    
        
      );
    }
  }
