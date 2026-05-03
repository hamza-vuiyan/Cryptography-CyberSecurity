// In The Name of Almighty Allah

#include <bits/stdc++.h>
using namespace std;


void solve(){
    int x, y; 
    cout << "Enter 2 Numbers: " << '\n';
    cin >> x >> y;
    int divisor = min(x, y);
    int dividant = max(x, y);
    while(1){
        int rem = dividant%divisor;
        if(rem == 0) break;
        dividant  = divisor;
        divisor = rem;
    }    

    cout << "GCD of " << x << " and " << y << " is " << divisor << '\n';
}

signed main(){
    solve();
}