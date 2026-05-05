// In The Name of Almighty Allah

#include <bits/stdc++.h>
using namespace std;

void solve(){
    cout << "Please Enter Two numbers: \n";
    int a, b; cin >> a >> b;  //Taking Two numbers as input
    
    int q, r, x0, x1, y0, y1; // Declaring some required variables
    
    // initializing them
    x0 = 1; x1 = 0; 
    y0 = 0; y1 = 1;
    
    if(a < b) swap(a, b); //handling wrong input order (i.e. divider greater then divident)
    int ta = a, tb = b; //Protecting Original input value
    

    while(b!=0){
        q = a/b;
        r = a%b;

        int x = x0 - q * x1;
        int y = y0 - q * y1;

       // assigning fresh values for next step
        a = b; 
        b = r;
        
        x0 = x1; y0 = y1;
        x1 = x; y1 = y;
    }

    cout << "gcd of " << ta << " and " << tb << " = "  << a << '\n'; //answer is divider of last step

    cout << ta << "*"<< x0 << " + " << tb << "*" << y0 << " = " << a << '\n'; 

}

signed main(){
    solve();
}