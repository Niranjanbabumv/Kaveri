import { Component, OnInit } from '@angular/core';
import { LandRecord, Owner } from '../models/LandRecord';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl
} from '@angular/forms';
import { ManageLandRecordsService } from '../services/managelandrecords.service';
import { ActivatedRoute, Params , Router} from '@angular/router'; 
import 'rxjs/add/operator/switchMap'; 

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent implements OnInit {
  pid : number;
  fetchComplete : boolean = false;
  template : string = "form1";
  noSearchResults : boolean = false;
  noSearchResultsSurvey : boolean = false;
  landRecord: LandRecord = new LandRecord(); //initialize land record object
  landRecords: LandRecord[];
  landRecordsMojani: LandRecord = new LandRecord();
  layoutForm: FormGroup;
  lat :number;
  long : number; 
  transferEnabled : boolean = false;
  formData: FormData = new FormData();
  sketchURL: string;

  constructor(private formBuilder: FormBuilder, private manageLandRecordsService : ManageLandRecordsService, private router: Router,private route: ActivatedRoute) { }
 
  ngOnInit() {
  }
  
  search(){
    var responseRecMojani = false;
    console.log("PID :" + this.pid);
    this.manageLandRecordsService.getLandRecordsMojaniByPid(this.pid)
    .subscribe(
      response => {
        console.log("res received from mojanibypid" + JSON.stringify(response));
        responseRecMojani = true;
        if(response !=null) {
          this.landRecordsMojani = <LandRecord> response.landRecords;
          if(this.landRecordsMojani!=null){
            this.noSearchResultsSurvey= false;
            if(this.landRecordsMojani.isMojaniApproved==true)
              this.transferEnabled=true;
            else this.transferEnabled=false;
          }else{
            this.noSearchResultsSurvey = true;
          }
          console.log("search result survey"+this.noSearchResultsSurvey);
        }
      }
    );
    this.manageLandRecordsService.getLandRecordsKaveriByPid(this.pid)
    .subscribe(
      response => {
            console.log("res received from getLandRecords service" + JSON.stringify(response));
            
            if (response !=null) {
              this.landRecords = <LandRecord[]> response.landRecords;
             if(this.landRecords!=null && this.landRecords.length > 0){
               this.noSearchResults= false;
               if(this.landRecords[0].isKaveriApproved==true)
               this.transferEnabled=true;
               else this.transferEnabled=false;               
             }else{
               this.noSearchResults = true;
             }
              this.fetchComplete = true; 
            }
        }); 
    }     

  loadRegistrationForm(){
    this.template = "form2";
    this.loadForm();
  }

  loadForm() {
    this.lat=null;
    this.long = null;
    this.layoutForm = this.formBuilder.group({
      TimeStamp: [null],
      pid: [''],
      wardNo: [null],
      areaCode: [null],
      siteNo: [null],
      geoData: this.formBuilder.group({
        latitude: [null],
        longitude: [null],
        length: [null],
        width: [null],
        totalArea: '',
        address: [null]
      }),
      preMutationSketch: [null],
      ownerDetails: this.formBuilder.group({
        ownerName: [null],
        gender:[null],
        aadharNo: [null],
        mobileNo: [null],
        emailID:[null],
        address: [null]
      }),
      newOwnerDetails: this.formBuilder.group({
        ownerName: [null, [Validators.required, Validators.pattern('[a-zA-Z\\s]*')]],
        gender:[null, Validators.required],
        aadharNo: [null, [Validators.required, Validators.pattern('[0-9]{12}')]],
        mobileNo: [null, [Validators.required,Validators.pattern('[0-9]{10}')]],
        emailID:[null, [Validators.required,Validators.email]],
        address: [null, Validators.required]
      }),
      saleRate :[null, Validators.required]
    });
          if(this.noSearchResults==false){
          this.manageLandRecordsService.getLandRecordsKaveriByPid(this.pid)
          .subscribe(
            response => {
              console.log("res received getLandRecordbyPid service" + JSON.stringify(response));
              if (response !=null && response.success) {
                this.landRecord = <LandRecord> response.landRecords[0];
                this.landRecord.ownerDetails = <Owner> this.landRecord.newOwnerDetails;
                this.landRecord.newOwnerDetails = <Owner> new Owner();
                console.log("landRecord object received:" + JSON.stringify(this.landRecord));
                if(response.landRecords[0].sketchURL!=null && response.landRecords[0].sketchURL!=""){
                  this.sketchURL = response.landRecords[0].sketchURL;
                }
                this.layoutForm.patchValue(this.landRecord);
                this.setGeoCordinates();
              }
            }); 
          }else if(this.noSearchResultsSurvey==false){
            this.manageLandRecordsService.getLandRecordsMojaniByPid(this.pid)
            .subscribe(
            response => {
              console.log("res received getLandRecordbyPid service" + JSON.stringify(response));
              if (response !=null && response.success) {
                this.landRecord = <LandRecord> response.landRecords;
                console.log("landRecord object received:" + this.landRecord);
                if(response.sketchURL!=null && response.sketchURL!=""){
                  this.sketchURL = response.sketchURL;
                }
                this.layoutForm.patchValue(this.landRecord);
                this.setGeoCordinates();
              }
            }); 
          } 
  }

  setGeoCordinates(){
    this.lat = parseFloat(this.layoutForm.get('geoData.latitude').value);
    this.long =parseFloat( this.layoutForm.get('geoData.longitude').value);
  }   

  IDGenerator() {    
      var length = 8;
      var timestamp = +new Date;      
      var _getRandomInt = function( min, max ) {
       return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
      } 
      var id = "";
        var ts = timestamp.toString();
        var parts = ts.split( "" ).reverse();      
        for( var i = 0; i < length; ++i ) {
         var index = _getRandomInt( 0, parts.length - 1 );
         id += parts[index];   
      } 
      return id;     
    } 
  
  onSubmit() {
    if (this.layoutForm.valid) {
      console.log('form valid success');
      //sync the form model with the data model
      this.landRecord = <LandRecord>this.layoutForm.value;
      this.landRecord.TimeStamp = new Date();
      this.landRecord.txnID = "TXN"+this.IDGenerator();
      this.landRecord.isKaveriApproved = false;
      this.landRecord.sketchURL = this.sketchURL;
      console.log("pid generated: " + this.landRecord.pid);
      console.log("txn id: "+this.landRecord.txnID);
      console.log("landrecord: " + JSON.stringify(this.landRecord));

      this.manageLandRecordsService.addLandRecordKaveri(this.landRecord)
        .subscribe(
        response => {
          console.log("res received addLandRecord service" + JSON.stringify(response));
            if (response !=null && response.success) {
              this.template = "form3";
            }
        });
    } else {
      this.validateAllFormFields(this.layoutForm);
    }
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      console.log(field);
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  displayFieldCss(field: string) {
    return {
      'has-error': this.isFieldValid(field),
      'has-feedback': this.isFieldValid(field)
    };
  }
  isFieldValid(field: string) {
    return !this.layoutForm.get(field).valid && this.layoutForm.get(field).touched;
  }

  submitNew() {
    this.fetchComplete = false;
    this.template = "form1";
    this.pid=null;
    this.transferEnabled = false;
  }
  back(){
    this.template = "form1";
  }
}
