#include <nan.h>
#include <iostream>
using namespace std;

#if defined( __linux__) || defined(__APPLE__)
    //linux code goes here
    #include <pwd.h>
    #include <chrono>
    #include <thread>
#elif _WIN32
    // windows code goes here
    #include <chrono>
    #include <thread>
#endif

string readFromKeyboard(string message) {
  string input;

  cout << message;
  cin >> input;

  return input;
}

string readOfuscatedFromKeyboard(string message){

  #if defined( __linux__) || defined(__APPLE__)
    char *psw = getpass(message.c_str());
    string output(psw);
  #elif _WIN32
    string output = readFromKeyboard(message);
  #endif

  return output;
}

template <typename Info>
bool InvalidArgs(Info& info, int argc){

    if (info.Length() < argc && !info[0]->IsStringObject()) {
        Nan::ThrowTypeError("Wrong number of arguments");
        return true;
    }
    return false;
}


struct Standard {
  /* http://izs.me/v8-docs/process_8cc-example.html  */
  static std::string ToString( v8::Local< v8::Value > value ) {

      if(!value->IsString())
          Nan::ThrowTypeError("Error: String type expected.");

      v8::String::Utf8Value utf8_value(value);
      return std::string(*utf8_value);
  }
};

void GetInputBlocking(const Nan::FunctionCallbackInfo<v8::Value>& info) {

    if(InvalidArgs(info, 1)) return;

    auto message = Standard::ToString( info[0]->ToString() );

    auto input = readFromKeyboard(message);

    info.GetReturnValue().Set(Nan::New(input.c_str()).ToLocalChecked());
}

void GetHiddenInputBlocking(const Nan::FunctionCallbackInfo<v8::Value>& info) {

    if(InvalidArgs(info, 1)) return;

    auto message = Standard::ToString( info[0]->ToString() );
    auto output  = readOfuscatedFromKeyboard(message);

    info.GetReturnValue().Set(Nan::New(output.c_str()).ToLocalChecked());
}


void Sleep(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    int32_t sleep_timer = 10;

    if(info[0]->IsNumber()) {
        sleep_timer = info[0]->Int32Value();
    }

    sleep_timer = sleep_timer * 1000;
    std::this_thread::sleep_for(std::chrono::milliseconds(sleep_timer));
    info.GetReturnValue().Set(Nan::New(sleep_timer));
}


void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    info.GetReturnValue().Set(Nan::New("world").ToLocalChecked());
}

void Init(v8::Local<v8::Object> exports) {
    exports->Set(Nan::New("hello").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(Method)->GetFunction());

    exports->Set(Nan::New("input").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(GetInputBlocking)->GetFunction());

      exports->Set(Nan::New("password").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(GetHiddenInputBlocking)->GetFunction());


    exports->Set(Nan::New("sleep").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(Sleep)->GetFunction());


}

NODE_MODULE(hello, Init)
