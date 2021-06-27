import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet, KeyboardAvoidingView, KeyboardAvoidingViewBase, ToastIOS, Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions : null,
      scanned : false,
      scannedBookId : '',
      scannedStudentId : '',
      buttonState : 'normal',
      transactionMessage : ''
    }
  }

  getCameraPermissions = async (id) =>{
    const {status}  = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions : status === "granted",
      buttonState : id,
      scanned : false
    })
  }

  handleBarCodeScanned  = async ({type, data})=>{
    const { buttonState} = this.state

    if(buttonState === "BookId"){
      this.setState({
        scanned : true,
        scannedBookId : data,
        buttonState : 'normal'
      });
    }
    else if(buttonState === "StudentId"){
      this.setState({
        scanned : true,
        scannedStudentId : data,
        buttonState : 'normal'
      })
    }
  }

  initiateBookIssue = async ()=>{
    //add a transaction
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'data' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Issue"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : false
    })
    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
    })

    this.setState({
      scannedStudentId : '',
      scannedBookId: ''
    })
  }

  initiateBookReturn = async ()=>{
    db.collection("transaction").add({
      'studentId': this.state.scannedStudentId,
      'bookId':this.state.scannedBookId,
      'data':firebase.firestore.Timestamp.now().toDate(),
      'transactionType':"Return"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability':true
    })
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
    })
    this.setState({
      scannedStudentId:'',
      scannedBookId:''
    })
  }
  checkBookEligibilty=async()=>{
    const bookref=await db.collection("books").where("bookId", "==", this.state.scannedBookId).get();
    var transactionType='';
    if(bookref.docs.length==0){
      transactionType=false
    }
    else{
      bookref.docs.map((doc)=>{
        var book=doc.data();
        if(book.bookAvailability){
          transactionType="issue"
        }
        else{
          transactionType="return"
        }
      })
    }
    return transactionType
  }
  checkStudentEligibiltyForBookIssued = async()=>{
    const studentref=await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get();
    var isStudentEligible="";
    if(studentref.docs.length==0){
      this.setState({
        scannedStudentId:'',
        scannedBookId:''
      })
      isStudentEligible=false;
      Alert.alert("The Student Id does not exist in the database");
    }
    else{
      studentref.docs.map((doc)=>{
        var student = doc.data();
        if(student.numberOfBooksIssued<2){
          isStudentEligible=true
        }
        else{
          isStudentEligible=false;
          Alert.alert("Student already has issued the maximum books");
          this.setState({
            scannedStudentId:'',
            scannedBookId:''
          })
        }
      })
    }
    return isStudentEligible
  }
  checkStudentEligibiltyForReturn = async()=>{
    const transactionref=await db.collection("transaction").where("bookId", "==", this.state.scannedBookId.limit(1).get())
    var isStudentEligible="";
    transactionref.docs.map((doc)=>{
      var lastBookTransaction=doc.data();
      if(lastBookTransaction.studentId===this.state.scannedStudentId){
        isStudentEligible=true
      }
      else{
        isStudentEligible=false;
        Alert.alert("Book was not Issued by This Student");
        this.setState({
          scannedStudentId:'',
          scannedBookId:''
        })
      }
    })
    return isStudentEligible
  }
  handleTransaction = async()=>{
    var transactionType = await this.checkBookEligibilty();
    if(!transactionType){
      Alert.alert("BOOK DOES NOT EXIST IN THE LIBRARY DATABASE");
      this.setState({
        scannedStudentId:'',
        scannedBookId:''
      })
    }
    else if(transactionType==="issue"){
      var isStudentEligible=await this.checkStudentEligibiltyForBookIssued();
      if(isStudentEligible){
        this.initiateBookIssue();
        Alert.alert("Book Isuued to The Student")
      }
    }
    else {
      var isStudentEligible=await this.checkStudentEligibiltyForReturn();
      if(isStudentEligible){
        this.initiateBookReturn();
        Alert.alert("Book Has Been Returned")
      }
    }
    
  }

  render(){
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if(buttonState !== "normal" && hasCameraPermissions){
      return(
        <BarCodeScanner
          onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
          style = {StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal"){
      return(
        <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
        <View style={styles.container}>
        <View>
          <Image
            source = {require("../assets/booklogo.jpg")}
            style= {{width:200, height:200}}/>
          <Text style={{textAlign:'center', fontSize:30,}}>Wily</Text>
        </View>
        <View style={styles.inputView}>
        <TextInput
          style={styles.inputBox}
          placeholder="Book Id"
          onChangeText={
            text=>this.setState({scannedBookId:text})
          }
          value={this.state.scannedBookId}/>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={()=>{
            this.getCameraPermissions("BookId")
          }}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        </View>

        <View style={styles.inputView}>
        <TextInput
          style={styles.inputBox}
          placeholder="Student Id"
          onChangeText={
            text=>this.setState({scannedStudentId:text})
          }
          value={this.state.scannedStudentId}/>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={()=>{
            this.getCameraPermissions("StudentId")
          }}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        </View>
        <Text style={styles.transactionAlert}>{this.state.transactionMessage}</Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={async()=>{
            var transactionMessage = await this.handleTransaction();
            
          }}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View></KeyboardAvoidingView>
      )
    }
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText:{
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton:{
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText:{
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10
  },
  inputView:{
    flexDirection: 'row',
    margin: 20
  },
  inputBox:{
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton:{
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton:{
    backgroundColor: '#FBC02D',
    width: 100,
    height:50
  },
  submitButtonText:{
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight:"bold",
    color: 'white'
  }
});