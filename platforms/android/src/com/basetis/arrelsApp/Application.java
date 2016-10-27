package com.basetis.arrelsApp;

import com.parse.Parse;
import com.parse.ParseInstallation;

/**
 * Created by Borja on 20/07/2015.
 */
public class Application extends android.app.Application {

    public Application(){

    }
    @Override
    public void onCreate(){
        super.onCreate();
     //   Fabric.with(this, new Crashlytics());
        Parse.initialize(this, "8Sl3yaPGS23FEBLci7pcLRgGErUHwHPT02If7Ae9", "5SsiKNXm9zXy3NzTXLPFlAdZZVmVJnvOumeOj3mk");
        ParseInstallation.getCurrentInstallation().saveInBackground();
    }
}
